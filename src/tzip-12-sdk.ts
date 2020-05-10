import { address, tokenId } from './types'
import {
  GenericContractAdapter,
  ContractStorageParams,
  ContractAdapterFactory
} from './adapters/generic/contractAdapter'
import { OriginationOperation } from '@taquito/taquito/dist/types/operations/origination-operation'
import { OriginateParamsBase } from '@taquito/taquito/dist/types/operations/types'
import { Tezos, TezosToolkit } from '@taquito/taquito'
import { Contract, ContractMethod } from '@taquito/taquito/dist/types/contract/contract'
import { tokenTransferWithId, tokenTransferWithIdBatch } from './adapters/generic/methods'
import { Token } from './models/token'

export interface TZIP12SDKOptions<AdapterType extends GenericContractAdapter> {
  adapterFactory: ContractAdapterFactory<AdapterType>
  tezos?: TezosToolkit
}

/**
 * SDK for TZIP-12 token contracts
 */
export class TZIP12SDK<AdapterType extends GenericContractAdapter> {
  public adapterFactory?: ContractAdapterFactory<AdapterType>
  public adapter?: AdapterType
  public contract?: Contract
  public tezos: TezosToolkit = Tezos

  constructor(TZIP12SDKOptions: TZIP12SDKOptions<AdapterType>) {
    Object.assign(this, TZIP12SDKOptions)
  }

  /**
   *
   * @param address
   */
  public async at(address: address): Promise<this> {
    this.contract = await this.tezos.contract.at(address)
    this.adapter = this.adapterFactory!(this.tezos, this.contract)
    return this
  }

  // TODO: should origination call `at` to configure the current instance as well?
  /**
   *
   * @param contractStorageParams
   * @param originateParams
   */
  public originate(
    contractStorageParams: ContractStorageParams,
    originateParams?: OriginateParamsBase
  ): Promise<OriginationOperation> {
    // if an adapter is already initialized, use it, otherwise initialize an empty adapter
    this.adapter = !this.adapter ? (this.adapter = this.adapterFactory!(this.tezos)) : this.adapter

    return this.adapter.originate(contractStorageParams, originateParams)
  }

  /**
   * Top level API for transfering tokens in a batch
   * @param tokenTransferBatch
   */
  transferTokenBatch(tokenTransferBatch: tokenTransferWithIdBatch): ContractMethod {
    return this.adapter!.transferTokenBatch(tokenTransferBatch)
  }

  /**
   * Top level API for an individual token transfer
   * @param tokenTransfer
   */
  transferToken(tokenTransfer: tokenTransferWithId): ContractMethod {
    return this.adapter!.transferToken(tokenTransfer)
  }

  // TODO: integrate with an indexer / indexer adapter
  /**
   *
   */
  async getAllTokens(): Promise<Token<AdapterType>[]> {
    return this.adapter!.getAllTokens()
  }

  /**
   *
   * @param tokenId
   */
  getTokenWithId(tokenId: tokenId): Token<AdapterType> {
    return Token.withId<AdapterType>(tokenId, this.adapter!, this.tezos)
  }

  /**
   *
   * @param address
   * @param TZIP12SDKOptions
   */
  public static async at<AdapterType extends GenericContractAdapter>(
    address: address,
    TZIP12SDKOptions: TZIP12SDKOptions<AdapterType>
  ): Promise<TZIP12SDK<AdapterType>> {
    const sdk = new this(TZIP12SDKOptions)
    return sdk.at(address)
  }
}
