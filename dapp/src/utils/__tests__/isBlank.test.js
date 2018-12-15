import { isBlank } from '../isBlank'

describe('isBlank', () => {
  it('is true for the 4 cases', () => {
    expect(
      isBlank(null)
    ).toEqual(true)

    expect(
      isBlank(undefined)
    ).toEqual(true)

    expect(
      isBlank('0x')
    ).toEqual(true)

    expect(
      isBlank('0x0000000000000000000000000000000000000000')
    ).toEqual(true)

    expect(
      isBlank('0x0000000000000000000000000000000000000000000000000000000000000000')
    ).toEqual(true)
  })
})
