export function bytes32ToAddress(bytes32) {
  if (!bytes32) { return '0x00000000000000000000'}
  return '0x' + bytes32.substring(26)
}
