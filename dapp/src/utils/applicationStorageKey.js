export function applicationStorageKey(networkId, address, applicationCreatedAt) {
  return `application-${networkId}-${address}-${applicationCreatedAt}`
}
