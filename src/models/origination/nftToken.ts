import BigNumber from 'bignumber.js'
import { tokenId, totalSupply, tokenOwner, tokenBalance } from '../../types'

export type Balances = Record<tokenOwner, tokenBalance>

export class NFTToken {
  public totalSupply?: totalSupply
  public balances: Balances = {}

  constructor(public tokenId: tokenId) {}

  /**
   *
   * @param tokenOwner
   */
  public setOwner(tokenOwner: tokenOwner): this {
    this.balances[tokenOwner] = new BigNumber(1)
    return this
  }

  /**
   *
   * @param tokenId
   */
  public static withId(tokenId: tokenId): NFTToken {
    return new NFTToken(tokenId)
  }
}
