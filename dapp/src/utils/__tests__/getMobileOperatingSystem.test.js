import { getMobileOperatingSystem } from '../getMobileOperatingSystem'

describe('getMobileOperatingSystem', () => {
  it('returns unknown when it does not recognize OS', () => {
    expect(
      getMobileOperatingSystem()
    ).toEqual('unknown')
  })

  it('provides info about the OS', () => {
    window.opera = 'iPad'
    expect(
      getMobileOperatingSystem()
    ).toEqual('iOS')
  })
})
