import { tokenId, tokenAmount, tokenOwner, tokenBalance } from '../types'
import { GenericContractAdapter } from '../adapters/generic/contractAdapter'
import { ContractMethod } from '@taquito/taquito/dist/types/contract/contract'
import { TezosToolkit } from '@taquito/taquito'
import { tokenTransferWithIdBatch } from '../adapters/generic/methods'

export type tokenTransfer = {
  amount: tokenAmount
  from: tokenOwner
  to: tokenOwner
}

export type tokenTransferBatch = tokenTransfer[]

export class Token<AdapterType extends GenericContractAdapter> {
  constructor(public tokenId: tokenId, public adapter: AdapterType, public tezos: TezosToolkit) {}

  public static withId<AdapterType extends GenericContractAdapter>(
    tokenId: tokenId,
    adapter: AdapterType,
    tezos: TezosToolkit
  ): Token<AdapterType> {
    return new Token<AdapterType>(tokenId, adapter, tezos)
  }

  /**
   *
   * @param tokenTransferBatch
   */
  transferBatch(tokenTransferBatch: tokenTransferBatch): ContractMethod {
    const tokenTransferWithIdBatch: tokenTransferWithIdBatch = tokenTransferBatch.map(
      (tokenTransfer: tokenTransfer) => ({
        token: this.tokenId,
        ...tokenTransfer
      })
    )
    return this.adapter!.transferTokenBatch(tokenTransferWithIdBatch)
  }

  /**
   *
   * @param tokenTransfer
   */
  transfer(tokenTransfer: tokenTransfer): ContractMethod {
    return this.adapter!.transferToken({
      token: this.tokenId,
      ...tokenTransfer
    })
  }

  getBalanceForOwner(tokenOwner: tokenOwner): Promise<tokenBalance> {
    return this.adapter.getTokenBalanceForOwner(this.tokenId, tokenOwner)
  }
}
