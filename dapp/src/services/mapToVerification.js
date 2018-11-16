export function mapToVerification (array) {
  if (!array || array.length < 5) { return {} }
  return {
    /// @notice The time at which the verifier was selected
    verifierSelectedAt: array[0],
    /// @notice The address of the selected verifier
    verifier: array[1],
    /// @notice The secret submitted by the verifier
    verifierSecret: array[2],
    /// @notice The time at which the verifier submitted their secret
    verifierSubmittedAt: array[3],
    /// @notice The time at which the verifier challenged the game due to a reveal timeout
    verifierChallengedAt: array[4]
  }
}
