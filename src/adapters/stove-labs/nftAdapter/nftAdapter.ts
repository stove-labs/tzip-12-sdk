import {
  GenericContractAdapter,
  contractCode,
  ContractStorageParams,
  ContractAdapterFactory,
  GenericStorage,
  GenericInitialStorage
} from '../../generic/contractAdapter'
import { MichelsonMap, TezosToolkit } from '@taquito/taquito'
import { tokenBalance, tokenOwner, tokenId, totalSupply } from '../../../types'
import { Token as TokenOrigination } from '../../../models/origination/token'
import { NFTToken as NFTTokenOrigination } from '../../../models/origination/nftToken'
import BigNumber from 'bignumber.js'
import { Token } from '../../../models/token'
import axios from 'axios'
import { Contract } from '@taquito/taquito/dist/types/contract/contract'

export interface GenericBigMapAbstraction<key, value> {
  get(keyToEncode: key): Promise<value>
  toString(): string
}

export type tokenOwnersMichelsonMap = MichelsonMap<tokenId, tokenOwner>

export interface InitialStorage extends GenericInitialStorage {
  tokenOwners: tokenOwnersMichelsonMap
}
export interface Storage extends GenericStorage {
  tokenOwners: GenericBigMapAbstraction<tokenId, tokenOwner>
}

export interface Config {
  indexerUrl: string
  indexerNetwork: string
}

const { michelson } = require('./../../../../../tzip-12/build/contracts/tzip-12-nft.json')

export class StoveLabsNFTContractAdapter extends GenericContractAdapter {
  public code: contractCode = JSON.parse(michelson)
  public config?: Config

  setConfig(config: Config): void {
    this.config = config
  }

  get storage(): Promise<Storage> {
    return this.contract!.storage<Storage>()
  }

  getInitialStorage(contractStorageParams: ContractStorageParams): InitialStorage {
    const initialStorage: InitialStorage = {
      tokenOwners: contractStorageParams.tokens.reduce(
        (michelsonMap: tokenOwnersMichelsonMap, token: TokenOrigination | NFTTokenOrigination) => {
          // first owner address in the balances ledger is the NFT owner
          const tokenOwner = Object.keys(token.balances)[0]
          michelsonMap.set(token.tokenId, tokenOwner)
          return michelsonMap
        },
        new MichelsonMap()
      )
    }
    return initialStorage
  }

  /**
   * If the given `tokenOwner` owns the given `tokenId`,
   * return `1` as the token balance
   * @param tokenId
   * @param tokenOwner
   */
  async getTokenBalanceForOwner(tokenId: tokenId, tokenOwner: tokenOwner): Promise<tokenBalance> {
    const realTokenOwner: tokenOwner = await (await this.storage).tokenOwners.get(
      `${tokenId}` as any
    )
    if (realTokenOwner === tokenOwner) return new BigNumber(1)
    return new BigNumber(0)
  }

  async getAllTokens(): Promise<Token<StoveLabsNFTContractAdapter>[]> {
    const bigMapId: string = (await this.storage).tokenOwners.toString()
    const url =
      `${this.config!.indexerUrl}` +
      `/v1/contract/${this.config!.indexerNetwork}` +
      `/${this.contract!.address}` +
      `/bigmap/${bigMapId}`

    const bigMapKeys = (await axios.get(url)).data
    // TODO: add better types
    const tokens = bigMapKeys.map((bigMapKey: any) => {
      const tokenId: tokenId = parseInt(bigMapKey.data.key_string)
      return Token.withId<StoveLabsNFTContractAdapter>(tokenId, this, this.tezos)
    })
    return tokens
  }

  /**
   * If there is an entry for the `tokenId` in the contract's ledger,
   * then the `totalSupply` will be `1`
   * @param tokenId
   */
  async getTotalTokenSupply(tokenId: tokenId): Promise<totalSupply> {
    const tokenOwner = await (await this.storage).tokenOwners.get(tokenId)
    if (tokenOwner) return new BigNumber(1)
    return new BigNumber(0)
  }

  /**
   * TokenIDs available within the NFT adapter are always non-fungible
   * @param tokenId
   */
  async isFungible(tokenId: tokenId): Promise<boolean> {
    return false
  }
}

export const stoveLabsNFTContractAdapterFactory: (
  config: any
) => ContractAdapterFactory<StoveLabsNFTContractAdapter> = (config: Config) => (
  tezos: TezosToolkit,
  contract?: Contract
) => {
  const instance = new StoveLabsNFTContractAdapter(tezos, contract)
  instance.setConfig(config)
  return instance
}
