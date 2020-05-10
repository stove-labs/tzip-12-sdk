import { TZIP12SDK } from '../src/tzip-12-sdk'
import { address, tokenBalance } from '../src/types'
import BigNumber from 'bignumber.js'
import {
  StoveLabsPascaligoContractAdapter,
  stoveLabsPascaligoContractAdapterFactory,
  Config as AdapterConfig
} from '../src/adapters/stove-labs/pascaligoContractAdapter/pascaligoContractAdapter'
import { ContractAdapterFactory } from '../src/adapters/generic/contractAdapter'
import { Token as OriginationToken } from '../src/models/origination/token'
import { OriginationOperation } from '@taquito/taquito/dist/types/operations/origination-operation'
import { Tezos } from '@taquito/taquito'
import { InMemorySigner } from '@taquito/signer'
import { TransactionOperation } from '@taquito/taquito/dist/types/operations/transaction-operation'
import { Token, tokenTransfer } from '../src/models/token'
const { alice, bob } = require('./../../tzip-12/scripts/sandbox/accounts')

/**
 * Set a long timeout due to time inbetween blocks
 */
jest.setTimeout(100000)

/**
 * This test suite is configured to work with a live deployed
 * tzip-12 contract. (usually within a sandbox)
 *
 *
 */
const address: address = require('./../../tzip-12/deployments/tzip_12')
const tokenId0 = 0
const tokenId3 = 3

let TZIP12: TZIP12SDK<StoveLabsPascaligoContractAdapter>

const rpc = 'http://localhost:8732'
const signer = new InMemorySigner(alice.sk)

const adapterConfig: AdapterConfig = {
  indexerNetwork: 'sandboxnet',
  indexerUrl: 'http://localhost:42000'
}

Tezos.setProvider({ rpc, signer })

const testToken0BalanceAlice = new BigNumber(100)
const testToken0: OriginationToken = OriginationToken.withId(tokenId0).setBalanceForOwner(
  alice.pkh,
  testToken0BalanceAlice
)

const testToken3BalanceAlice = new BigNumber(50)
const testToken3: OriginationToken = OriginationToken.withId(tokenId3).setBalanceForOwner(
  alice.pkh,
  testToken3BalanceAlice
)

/**
 * Token.getBalanceForOwner(alice.pkh)
 * Token.
 */

describe('TZIP12SDK', () => {
  test('it should originate a contract using the provided adapter', async () => {
    TZIP12 = new TZIP12SDK<StoveLabsPascaligoContractAdapter>({
      adapterFactory: stoveLabsPascaligoContractAdapterFactory(adapterConfig)
    })

    const originationOperation: OriginationOperation = await TZIP12.originate({
      tokens: [testToken0, testToken3]
    })

    await originationOperation.confirmation(1)
    TZIP12 = await TZIP12.at(originationOperation.contractAddress!)
    console.log('TZIP12 deployed at:', TZIP12.contract!.address)
  })

  test('it should get all the deployed tokens', async () => {
    const allTokens: Token<StoveLabsPascaligoContractAdapter>[] = await TZIP12.getAllTokens()
    // assuming the order stays the same as when this test was written;
    const token3 = allTokens[0]
    expect(token3.tokenId).toBe(tokenId3)
  })

  test('it should return the real balance of alice for token `3`', async () => {
    const token3 = TZIP12.getTokenWithId(tokenId3)
    const balanceAlice = await token3.getBalanceForOwner(alice.pkh)
    expect(balanceAlice.toNumber()).toBe(testToken3BalanceAlice.toNumber())
  })

  test('it should return the updated balance for alice after transfering tokens to bob', async () => {
    const token3 = TZIP12.getTokenWithId(tokenId3)

    const amount = new BigNumber(10)
    const tokenTransfer: tokenTransfer = {
      amount,
      // possibly let the configured signer configure a default 'from' address
      from: alice.pkh,
      to: bob.pkh
    }

    const transactionOperation: TransactionOperation = await token3.transfer(tokenTransfer).send()
    await transactionOperation.confirmation(1)

    const balanceAlice = await token3.getBalanceForOwner(alice.pkh)
    expect(balanceAlice.toNumber()).toBe(testToken3BalanceAlice.minus(amount).toNumber())
  })
})
