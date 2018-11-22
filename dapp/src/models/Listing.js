import BN from 'bn.js'
import { isBlank } from '~/utils/isBlank'

export class Listing {
  constructor (array) {
    if (array) {
      this.owner = array[0]
      this.deposit = new BN(array[1])
    } else {
      this.deposit = new BN('0')
    }
  }

  isDeleted() {
    return isBlank(this.owner)
  }
}
