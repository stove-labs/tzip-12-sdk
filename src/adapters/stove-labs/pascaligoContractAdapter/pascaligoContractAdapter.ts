import {
  GenericContractAdapter,
  adapterFactoryFactory,
  contractCode,
  ContractStorageParams,
  GenericInitialStorage,
  ContractAdapterFactory,
  GenericStorage
} from '../../generic/contractAdapter'
import { address, tokenId, tokenBalance, tokenOwner, totalSupply } from './../../../types'
import BigNumber from 'bignumber.js'
import { TezosToolkit, MichelsonMap, BigMapAbstraction } from '@taquito/taquito'
import { Token as OriginationToken } from '../../../models/origination/token'
import { Contract } from '@taquito/taquito/dist/types/contract/contract'
import { Token } from '../../../models/token'
import axios from 'axios'
/**
 * Currently the SDK build depends on having the `tzip-12` repo
 * cloned right next to the sdk repo, this shall change in upcoming commits.
 */
const { michelson } = require('./../../../../../tzip-12/build/contracts/tzip_12.json')

export type tokenLookupId = (tokenOwner | tokenId)[]
export type tokenBalancesMichelsonMap = MichelsonMap<tokenLookupId, tokenBalance>
export type tokenTotalSupplyMichelsonMap = MichelsonMap<tokenId, totalSupply>

export interface InitialStorage extends GenericInitialStorage {
  token_balances: MichelsonMap<any, any>
  total_token_supply: MichelsonMap<any, any>
}

export interface GenericBigMapAbstraction<key, value> {
  get(keyToEncode: key): Promise<value>
  toString(): string
}

export interface Storage extends GenericStorage {
  token_balances: GenericBigMapAbstraction<tokenLookupId, tokenBalance>
  total_token_supply: GenericBigMapAbstraction<tokenId, totalSupply>
}

export interface Config {
  indexerUrl: string
  indexerNetwork: string
}

export class StoveLabsPascaligoContractAdapter extends GenericContractAdapter {
  public code: contractCode = JSON.parse(michelson)
  public config?: Config

  setConfig(config: Config): void {
    this.config = config
  }

  getTokenLookupId(tokenId: tokenId, tokenOwner: tokenOwner): tokenLookupId {
    return [tokenId, tokenOwner]
  }

  getInitialStorage(contractStorageParams: ContractStorageParams): InitialStorage {
    const initialStorage: InitialStorage = {
      /**
       * Iterate through given tokens and their balances
       * to compose a MichelsonMap with appropriate tokenLookupIDs and balances
       */
      token_balances: contractStorageParams.tokens.reduce(
        (michelsonMap: tokenBalancesMichelsonMap, token: OriginationToken) => {
          return Object.keys(token.balances).reduce(
            (michelsonMap: tokenBalancesMichelsonMap, tokenOwner: tokenOwner) => {
              const balance: tokenBalance = token.balances[tokenOwner]
              // TODO: create a helper to manage tokenLookupId creation
              const tokenLookupId: tokenLookupId = this.getTokenLookupId(token.tokenId, tokenOwner)

              michelsonMap.set(tokenLookupId, balance)
              return michelsonMap
            },
            michelsonMap
          )
        },
        new MichelsonMap()
      ),
      /**
       * Iterate through given tokens and their balances
       * to compose a MichelsonMap with appropriate tokenId and totalSupply
       */
      total_token_supply: contractStorageParams.tokens.reduce(
        (michelsonMap: tokenTotalSupplyMichelsonMap, token: OriginationToken) => {
          const totalSupply: totalSupply = Object.values(token.balances).reduce(
            (totalSupply: totalSupply, tokenBalance: tokenBalance) => {
              return totalSupply.plus(tokenBalance)
            },
            new BigNumber(0)
          )
          michelsonMap.set(token.tokenId, totalSupply)
          return michelsonMap
        },
        new MichelsonMap()
      )
    }

    return initialStorage
  }

  get storage(): Promise<Storage> {
    return this.contract!.storage<Storage>()
  }

  async getTokenBalanceForOwner(tokenId: tokenId, tokenOwner: tokenOwner): Promise<tokenBalance> {
    const tokenLookupId = this.getTokenLookupId(tokenId, tokenOwner)
    return (await this.storage).token_balances.get(tokenLookupId)
  }

  async getTotalTokenSupply(tokenId: tokenId): Promise<totalSupply> {
    return (await this.storage).total_token_supply.get(tokenId)
  }

  async getAllTokens(): Promise<Token<StoveLabsPascaligoContractAdapter>[]> {
    const totalSupplyBigMapId: string = (await this.storage).total_token_supply.toString()
    const url =
      `${this.config!.indexerUrl}` +
      `/v1/contract/${this.config!.indexerNetwork}` +
      `/${this.contract!.address}` +
      `/bigmap/${totalSupplyBigMapId}`
    const bigMapKeys = (await axios.get(url)).data
    // TODO: add better types
    const tokens = bigMapKeys.map((bigMapKey: any) => {
      const tokenId: tokenId = parseInt(bigMapKey.data.key_string)
      return Token.withId<StoveLabsPascaligoContractAdapter>(tokenId, this, this.tezos)
    })
    return tokens
  }
}

export const stoveLabsPascaligoContractAdapterFactory: (
  config: any
) => ContractAdapterFactory<StoveLabsPascaligoContractAdapter> = (config: Config) => (
  tezos: TezosToolkit,
  contract?: Contract
) => {
  const instance = new StoveLabsPascaligoContractAdapter(tezos, contract)
  instance.setConfig(config)
  return instance
}
