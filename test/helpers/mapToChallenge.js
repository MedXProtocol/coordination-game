module.exports = function (array) {
  if (!array) return {}
  return {
    id: array[0],
    round: array[1],
    challengeTotal: array[2],
    approveTotal: array[3],
    updatedAt: array[4],
    state: array[5]
    // challengeDeposits: array[7],
    // approveDeposits: array[8]
  }
}
