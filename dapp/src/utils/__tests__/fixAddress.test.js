import { fixAddress } from '../fixAddress'

describe('fixAddress', () => {
  it('drops the case', () => {
    expect(
      fixAddress('0xAbcD')
    ).toEqual('0xabcd')
  })
})
