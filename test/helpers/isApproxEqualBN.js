const BN = require('bn.js')

/// @notice Loosely compares two BigNumbers.  It ensures that they are +/- the diff
/// @param diff The maximum size of the difference
module.exports = function (a, b, diff) {
  if (!diff) {
    diff = new BN('100000000000000000') // 0.01 ether
  }
  if (typeof a === 'string' ||
      typeof a === 'number') {
    a = new BN(a)
  }
  if (typeof b === 'string' ||
      typeof b === 'number') {
    b = new BN(b)
  }
  if (typeof diff === 'string' ||
      typeof diff === 'number') {
    diff = new BN(diff)
  }
  const div = a.sub(b).abs()
  const lte = div.lte(diff)
  return lte
}
