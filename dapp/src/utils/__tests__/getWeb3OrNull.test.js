import { getWeb3OrNull } from '../getWeb3OrNull'

// This works because window and web3 are set as globals in the jest setup file

describe('getWeb3OrNull', () => {
  it('gives injected web3 instance if a window object exists with the web3 property', () => {
    expect(
      typeof getWeb3OrNull().eth.estimateGas
    ).toEqual('function')
  })
})
