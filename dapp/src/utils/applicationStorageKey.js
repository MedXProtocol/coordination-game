export function applicationStorageKey(networkId, address, applicationCreatedAt) {
  let key

  if (networkId && address && applicationCreatedAt) {
    key = `application-${networkId}-${address}-${applicationCreatedAt}`
  }
  
  return key
}
