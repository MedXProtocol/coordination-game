module.exports = function (array) {
  if (!array) return {}
  return {
    owner: array[0],
    unstakedDeposit: array[1]
  }
}
