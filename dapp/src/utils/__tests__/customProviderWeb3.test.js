import { customProviderWeb3 } from '../customProviderWeb3'

describe('customProviderWeb3', () => {
  it('works consistently for all sorts of types', () => {
    const networkId = 1

    const w3 = customProviderWeb3(networkId)

    expect(
      typeof w3.eth.estimateGas
    ).toEqual('function')

    // memoized (value from memory)
    expect(
      customProviderWeb3(networkId)
    ).toEqual(w3)
  })

  it('returns the window web3 provider for networks it does not know about', () => {
    // FIXME: This is a difficult thing to test
    // expect(
    //   customProviderWeb3(987)
    // ).toEqual(window.web3)
  })
})
