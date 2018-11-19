module.exports = function (array) {
  if (!array) return {}
  return {
    id: array[0],
    firstChallengeSize: array[1],
    round: array[2],
    challengeTotal: array[3],
    approveTotal: array[4],
    updatedAt: array[5],
    state: array[6]
    // challengeDeposits: array[7],
    // approveDeposits: array[8]
  }
}
