import { getWeb3 } from '~/utils/getWeb3'

export function tickerToBytes32(ticker) {
  const web3 = getWeb3()
  const tickerHex = web3.utils.asciiToHex(ticker.trim())
  return web3.eth.abi.encodeParameter('bytes32', tickerHex)
}
