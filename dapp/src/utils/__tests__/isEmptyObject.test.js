import { isEmptyObject } from '../isEmptyObject'

describe('isEmptyObject', () => {
  it('works properly', () => {
    expect(
      isEmptyObject({})
    ).toEqual(true)

    expect(
      isEmptyObject({ hi: 'hi' })
    ).toEqual(false)
  })
})
