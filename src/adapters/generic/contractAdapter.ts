import { address, tokenId, tokenBalance, tokenAmount, tokenOwner, totalSupply } from '../../types'
import { Tezos, TezosToolkit } from '@taquito/taquito'
import { OriginateParamsBase } from '@taquito/taquito/dist/types/operations/types'
import { OriginationOperation } from '@taquito/taquito/dist/types/operations/origination-operation'
import { Contract, ContractMethod } from '@taquito/taquito/dist/types/contract/contract'
import { Token } from '../../models/token'
import { Token as TokenOrigination } from '../../models/origination/token'
import { NFTToken as NFTTokenOrigination } from '../../models/origination/nftToken'
import { TransactionOperation } from '@taquito/taquito/dist/types/operations/transaction-operation'
import { type } from 'os'
import {
  TZIP12ContractMethods,
  tokenTransferWithIdBatch,
  michelsontokenTransferBatch,
  michelsonTokenTransfer,
  tokenTransferWithId
} from './methods'

export type contractCode = string

export type ContractStorageParams = {
  tokens: (TokenOrigination | NFTTokenOrigination)[]
  /**
   * Allow for arbitrary data to be passed to the contract storage adapter
   */
  extras?: any
}

export type GenericInitialStorage = any
export type GenericStorage = any

/**
 * A base adapter to be extended by concrete contract adapter implementations
 */
export abstract class GenericContractAdapter {
  /**
   * Michelson source code for origination
   */
  public abstract code: string

  constructor(public tezos: TezosToolkit, public contract?: Contract) {}

  abstract getInitialStorage(contractStorageParams: ContractStorageParams): GenericInitialStorage
  abstract getTokenBalanceForOwner(tokenId: tokenId, tokenOwner: tokenOwner): Promise<tokenBalance>
  abstract getTotalTokenSupply(tokenId: tokenId): Promise<totalSupply>
  abstract getAllTokens(): Promise<Token<any>[]>
  abstract isFungible(tokenId: tokenId): Promise<boolean>

  abstract get storage(): Promise<GenericStorage>

  originate(
    contractStorageParams: ContractStorageParams,
    originateParams?: OriginateParamsBase
  ): Promise<OriginationOperation> {
    return this.tezos.contract.originate({
      code: this.code,
      storage: this.getInitialStorage(contractStorageParams),
      ...originateParams
    })
  }

  get methods(): TZIP12ContractMethods {
    return (this.contract!.methods as unknown) as TZIP12ContractMethods
  }

  transferToken(tokenTransfer: tokenTransferWithId): ContractMethod {
    const contractParameter: michelsontokenTransferBatch = [
      {
        from_: tokenTransfer.from,
        txs: [
          {
            token_id:
              ((tokenTransfer.token as unknown) as Token<any>).tokenId ||
              ((tokenTransfer.token as unknown) as tokenId),
            amount: tokenTransfer.amount,
            to_: tokenTransfer.to
          }
        ]
      }
    ]
    return this.methods.transfer(contractParameter)
  }

  transferTokenBatch(tokenTransferBatch: tokenTransferWithIdBatch): ContractMethod {
    const contractParameter: michelsontokenTransferBatch = tokenTransferBatch.map(
      (tokenTransfer: tokenTransferWithId) => {
        const michelsonTokenTransfer: michelsonTokenTransfer = {
          from_: tokenTransfer.from,
          txs: [
            {
              token_id:
                ((tokenTransfer.token as unknown) as Token<any>).tokenId ||
                ((tokenTransfer.token as unknown) as tokenId),
              amount: tokenTransfer.amount,
              to_: tokenTransfer.to
            }
          ]
        }
        return michelsonTokenTransfer
      }
    )
    return this.methods.transfer(contractParameter)
  }
}

export type ContractAdapterFactory<AdapterType> = (
  tezos: TezosToolkit,
  contract?: Contract
) => AdapterType

/**
 * TODO: Figure out a way to type this without `any`
 * @param adapter
 */
export const adapterFactoryFactory = <AdapterType>(
  adapter: any
): ContractAdapterFactory<AdapterType> => {
  return (tezos: TezosToolkit, contract?: Contract): AdapterType => new adapter(tezos, contract)
}
