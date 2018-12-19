import BN from 'bn.js'
import { defined } from '~/utils/defined'
import { isBlank } from '~/utils/isBlank'

export class Listing {
  constructor (array) {
    if (array) {
      this.owner = array[0]
      this.deposit = new BN(array[1])
      this.secret = array[2]
      this.hint = array[3]
    } else {
      this.deposit = new BN('0')
    }
  }

  isDeleted() {
    return defined(this.owner) && isBlank(this.owner)
  }
}
