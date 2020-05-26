import { TZIP12SDK } from '../src/tzip-12-sdk'
import { NFTToken as NFTTokenOrigination } from '../src/models/origination/nftToken'
import { address } from '../src/types'
import BigNumber from 'bignumber.js'
import { Tezos } from '@taquito/taquito'
import { InMemorySigner } from '@taquito/signer'
import {
  StoveLabsNFTContractAdapter,
  stoveLabsNFTContractAdapterFactory,
  Config as AdapterConfig
} from '../src/adapters/stove-labs/nftAdapter/nftAdapter'
import { Token } from '../src/models/token'

const { alice, bob } = require('./../../tzip-12/scripts/sandbox/accounts')

/**
 * Set a long timeout due to time inbetween blocks
 */
jest.setTimeout(100000)

const setSigner = (sk: any) => {
  const rpc = 'http://localhost:8732'
  const signer = new InMemorySigner(sk)
  Tezos.setProvider({ rpc, signer })
}
setSigner(alice.sk)

const adapterConfig: AdapterConfig = {
  indexerNetwork: 'sandboxnet',
  indexerUrl: 'http://localhost:42000'
}

describe('TZIP12SDK', () => {
  test('it should originate a contract using the provided adapter', async () => {
    /**
     * Create new instance of the SDK with the chosen adapter
     */
    let TZIP12 = new TZIP12SDK<StoveLabsNFTContractAdapter>({
      adapterFactory: stoveLabsNFTContractAdapterFactory(adapterConfig)
    })

    /**
     * Prepare initial storage data / tokens
     */
    const tokensOrigination: NFTTokenOrigination[] = [
      NFTTokenOrigination.withId(0).setOwner(alice.pkh),
      NFTTokenOrigination.withId(2).setOwner(bob.pkh)
    ]

    /**
     * Originate a new token contract with the given tokens
     */
    const originationOperation = await TZIP12.originate({
      tokens: tokensOrigination
    })

    // wait for it to be included in the blockchain
    await originationOperation.confirmation(1)

    /**
     * Create a new SDK instance with the live deployed contract.
     */
    TZIP12 = await TZIP12SDK.at<StoveLabsNFTContractAdapter>(
      originationOperation.contractAddress!,
      {
        adapterFactory: stoveLabsNFTContractAdapterFactory(adapterConfig)
      }
    )

    // const tokens: Token<StoveLabsNFTContractAdapter>[] = await TZIP12.getAllTokens();
  })
})

// const testToken0BalanceAlice = new BigNumber(100)
// const testToken0: TokenOrigination = TokenOrigination.withId(tokenId0).setBalanceForOwner(
//   alice.pkh,
//   testToken0BalanceAlice
// )

// const testToken3BalanceAlice = new BigNumber(50)
// const testToken3: TokenOrigination = TokenOrigination.withId(tokenId3).setBalanceForOwner(
//   alice.pkh,
//   testToken3BalanceAlice
// )

/**
 * Token.getBalanceForOwner(alice.pkh)
 * Token.
 */

// describe('TZIP12SDK', () => {
//   test('it should originate a contract using the provided adapter', async () => {
//     TZIP12 = new TZIP12SDK<StoveLabsPascaligoContractAdapter>({
//       adapterFactory: stoveLabsPascaligoContractAdapterFactory(adapterConfig)
//     })

//     const originationOperation: OriginationOperation = await TZIP12.originate({
//       tokens: [testToken0, testToken3]
//     })

//     await originationOperation.confirmation(1)
//     TZIP12 = await TZIP12.at(originationOperation.contractAddress!)
//     console.log('TZIP12 deployed at:', TZIP12.contract!.address)
//   })

//   test('it should get all the deployed tokens', async () => {
//     const allTokens: Token<StoveLabsPascaligoContractAdapter>[] = await TZIP12.getAllTokens()
//     // assuming the order stays the same as when this test was written;
//     const token3 = allTokens[0]
//     expect(token3.tokenId).toBe(tokenId3)
//   })

//   test('it should return the real balance of alice for token `3`', async () => {
//     const token3 = TZIP12.getTokenWithId(tokenId3)
//     const balanceAlice = await token3.getBalanceForOwner(alice.pkh)
//     expect(balanceAlice.toNumber()).toBe(testToken3BalanceAlice.toNumber())
//   })

//   test('it should return the updated balance for alice after transfering tokens to bob', async () => {
//     const token3 = TZIP12.getTokenWithId(tokenId3)

//     const amount = new BigNumber(10)
//     const tokenTransfer: tokenTransfer = {
//       amount,
//       // possibly let the configured signer configure a default 'from' address
//       from: alice.pkh,
//       to: bob.pkh
//     }

//     const transactionOperation: TransactionOperation = await token3.transfer(tokenTransfer).send()
//     await transactionOperation.confirmation(1)

//     const balanceAlice = await token3.getBalanceForOwner(alice.pkh)
//     expect(balanceAlice.toNumber()).toBe(testToken3BalanceAlice.minus(amount).toNumber())
//   })
// })
