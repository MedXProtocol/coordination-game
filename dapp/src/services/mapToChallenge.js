export function mapToChallenge(array) {
  if (!array) return {}
  return {
    id: array[0],
    round: array[1],
    challengeTotal: array[2],
    approveTotal: array[3],
    updatedAt: array[4],
    state: array[5]
  }
}
