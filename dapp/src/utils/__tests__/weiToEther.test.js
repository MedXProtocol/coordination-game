import { weiToEther } from '../weiToEther'

describe('weiToEther', () => {
  it('should handle large numbers', () => {
    expect(weiToEther(3333333333333336)).toEqual('0.003333333333333336')
  })
})
