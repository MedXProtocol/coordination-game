import { hexHintToTokenData } from '../hexHintToTokenData'

describe('hexHintToTokenData', () => {
  it('works as expected', () => {
    expect(
      hexHintToTokenData('0x43243400000000000000000000000000000000000000000000000000000000')[0]
    ).toMatch("C$4")

    expect(
      hexHintToTokenData('0x68656c6c6f2d7468657265')
    ).toEqual(["hello", "there"])

    expect(
      hexHintToTokenData(null)
    ).toEqual(["", ""])
  })
})
