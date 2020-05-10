import BigNumber from 'bignumber.js'
import { tokenId, totalSupply, tokenOwner, tokenBalance } from '../../types'

export type Balances = Record<tokenOwner, tokenBalance>

export class Token {
  public totalSupply?: totalSupply
  public balances: Balances = {}

  constructor(public tokenId: tokenId) {}

  /**
   *
   * @param tokenOwner
   * @param balance
   */
  public setBalanceForOwner(tokenOwner: tokenOwner, balance: tokenBalance): this {
    this.balances[tokenOwner] = balance
    return this
  }

  /**
   *
   * @param tokenId
   */
  public static withId(tokenId: tokenId): Token {
    return new Token(tokenId)
  }
}
