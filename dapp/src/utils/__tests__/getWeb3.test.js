import { getWeb3 } from '../getWeb3'

describe('getWeb3', () => {
  it('provides a web3 instance', () => {
    expect(
      typeof getWeb3().eth.estimateGas
    ).toEqual('function')
  })
})
