import { getWeb3 } from '~/utils/getWeb3'

// Takes the hint as a hex string and returns an array with
// 2 elements: [0] tokenTicker, [1] tokenName
export function hexHintToTokenData(hexHint) {
  if (!hexHint) { return ['', ''] }

  return getWeb3().utils.hexToAscii(hexHint).split('-')
}
