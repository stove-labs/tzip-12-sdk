import { ContractMethod } from '@taquito/taquito/dist/types/contract/contract'
import { tokenId, tokenAmount, tokenOwner } from '../../types'
import { Token } from '../../models/origination/token'

export type tokenTransferWithId = {
  token: Token | tokenId
  amount: tokenAmount
  from: tokenOwner
  to: tokenOwner
}

export type tokenTransferWithIdBatch = tokenTransferWithId[]

export type michelsonTokenTransfer = {
  token_id: tokenId
  amount: tokenAmount
  from_: tokenOwner
  to_: tokenOwner
}

export type michelsontokenTransferBatch = michelsonTokenTransfer[]

export interface TZIP12ContractMethods {
  transfer(tokenTransferBatch: michelsontokenTransferBatch): ContractMethod
}
