import { bytes32ToTicker } from '../bytes32ToTicker'
import { tickerToBytes32 } from '../tickerToBytes32'

describe('bytes32ToTicker', () => {
  it('should convert to bytes32', () => {
    const word = '$PICK'
    const bytes = tickerToBytes32(word)
    expect(
      bytes32ToTicker(bytes)
    ).toMatch(word)
  })
})
