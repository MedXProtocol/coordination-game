module.exports = function (array) {
  return {
    applicationId: array[0],
    applicant: array[1],
    secretAndRandomHash: array[2],
    randomHash: array[3],
    hint: array[4],
    createdAt: array[5],
    updatedAt: array[6],
    applicationFeeWei: array[7],
    applicantTokenDeposit: array[8],
    /// @notice the block number whose hash is to be used for randomness
    randomBlockNumber: array[9],
    applicantSecret: array[10],
    whistleblower: array[11]
  }
}
