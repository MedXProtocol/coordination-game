export function mapToListing (array) {
  if (!array) return {}
  return {
    owner: array[0],
    deposit: array[1]
  }
}
