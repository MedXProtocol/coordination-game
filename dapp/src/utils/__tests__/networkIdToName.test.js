import { networkIdToName } from '../networkIdToName'

describe('networkIdToName', () => {
  it('returns Unknown for missing network name', () => {
    expect(
      networkIdToName(112387)
    ).toEqual('Unknown')
  })

  it('should give proper name to match', () => {
    expect(
      networkIdToName(1)
    ).toEqual('Mainnet')

    expect(
      networkIdToName(2)
    ).toEqual('Morden')

    expect(
      networkIdToName(3)
    ).toEqual('Ropsten')

    expect(
      networkIdToName(4)
    ).toEqual('Rinkeby')

    expect(
      networkIdToName(8)
    ).toEqual('Ubiq')

    expect(
      networkIdToName(42)
    ).toEqual('Kovan')

    expect(
      networkIdToName(1234)
    ).toEqual('Localhost')
  })
})
