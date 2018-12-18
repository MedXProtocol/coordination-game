import { etherToWei } from '../etherToWei'

describe('etherToWei', () => {
  it('will convert the small unit to the large one', () => {
    expect(
      etherToWei('2410500000000000')
    ).toEqual('2410500000000000000000000000000000')

    expect(
      etherToWei('1')
    ).toEqual('1000000000000000000')
  })
})
