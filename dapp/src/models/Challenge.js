import BN from 'bn.js'

function toBN(value) {
  if (!value) {
    value = new BN('0')
  }
  if (typeof value === 'string' ||
      typeof value === 'number') {
    value = new BN(value)
  }
  return value
}

export class Challenge {
  constructor(array) {
    if (array) {
      this.id = array[0]
      this.round = array[1]
      this.challengeTotal = array[2]
      this.approveTotal = array[3]
      this.updatedAt = array[4]
      this.state = array[5]
    }
  }

  isComplete () {
    return this.state === '0' || this.state === '3' || this.state === '4'
  }

  isTimedOut (latestBlockTimestamp, timeout) {
    return toBN(latestBlockTimestamp).gt(toBN(timeout).add(toBN(this.updatedAt)))
  }
}
