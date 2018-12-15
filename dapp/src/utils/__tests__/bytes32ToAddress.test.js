import { bytes32ToAddress } from '../bytes32ToAddress'

describe('bytes32ToAddress', () => {
  it('return an address', () => {
    expect(
      bytes32ToAddress('0xfabfabfabfabfabfabfabfafb00fa0fa0fa0fa0')
    ).toEqual('0xb00fa0fa0fa0fa0')
  })

  it('returns an empty bytes if no address is provided', () => {
    expect(
      bytes32ToAddress()
    ).toEqual('0x00000000000000000000')
  })
})
