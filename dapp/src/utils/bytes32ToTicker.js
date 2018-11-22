import { getWeb3 } from '~/utils/getWeb3'

export function bytes32ToTicker(hexBytes) {
  const web3 = getWeb3()
  return web3.utils.hexToAscii(hexBytes)
}
