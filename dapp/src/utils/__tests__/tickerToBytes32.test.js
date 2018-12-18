import { tickerToBytes32 } from '../tickerToBytes32'

describe('tickerToBytes32', () => {
  it('should convert to bytes32', () => {
    expect(
      tickerToBytes32('$PICK')
    ).toEqual('0x245049434b000000000000000000000000000000000000000000000000000000')
  })
})
