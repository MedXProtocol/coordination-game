import { defined } from '../defined'

describe('defined', () => {
  it('works consistently for all sorts of types', () => {
    expect(
      defined(true)
    ).toEqual(true)

    expect(
      defined(false)
    ).toEqual(true)

    expect(
      defined('')
    ).toEqual(true)

    expect(
      defined('Yep!')
    ).toEqual(true)

    expect(
      defined(1234)
    ).toEqual(true)

    expect(
      defined({ hi: 'there' })
    ).toEqual(true)

    expect(
      defined({})
    ).toEqual(true)

    expect(
      defined(undefined)
    ).toEqual(false)

    expect(
      defined(null)
    ).toEqual(false)
  })
})
