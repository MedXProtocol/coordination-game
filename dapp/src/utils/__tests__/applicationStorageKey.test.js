import { applicationStorageKey } from '../applicationStorageKey'

describe('applicationStorageKey', () => {
  it('returns a nicely formatted string', () => {
    expect(
      applicationStorageKey(1234, '0xfa', 123521454325)
    ).toEqual('application-1234-0xfa-123521454325')
  })

  it('returns nothing when missing params', () => {
    expect(
      applicationStorageKey(1234, 123521454325)
    ).toEqual(undefined)
  })
})
