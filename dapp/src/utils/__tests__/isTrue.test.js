import { isTrue } from '../isTrue'

describe('isTrue', () => {
  it('is true for the 3 cases', () => {
    expect(
      isTrue(true)
    ).toEqual(true)

    expect(
      isTrue('True')
    ).toEqual(true)

    expect(
      isTrue('true')
    ).toEqual(true)
  })
})
