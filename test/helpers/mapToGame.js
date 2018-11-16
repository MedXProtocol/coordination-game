module.exports = function (array) {
  return {
    applicationId: array[0],
    applicant: array[1],
    secretAndRandomHash: array[2],
    randomHash: array[3],
    hint: array[4],
    createdAt: array[5],
    applicationBalanceInWei: array[6],
    applicantTokenDeposit: array[7],
    /// @notice the block number whose hash is to be used for randomness
    randomBlockNumber: array[8],
    applicantSecret: array[9],
    whistleblower: array[10]
  }
}
