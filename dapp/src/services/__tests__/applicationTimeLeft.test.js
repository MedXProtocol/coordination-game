import { applicationTimeLeft } from '../applicationTimeLeft'

describe('applicationTimeLeft', () => {

  let currentTime = 10000
  let applicationObject = {}
  let applicationState = {}
  let timeLeft

  describe('#needsApplicantReveal', () => {

    applicationState.needsApplicantReveal = true

    test('returns the proper hours, minutes and seconds', () => {
      applicationObject.applicantRevealExpiresAt = 10007
      timeLeft = applicationTimeLeft(currentTime, applicationObject, applicationState)

      expect(timeLeft.hours).toEqual('00')
      expect(timeLeft.minutes).toEqual('00')
      expect(timeLeft.seconds).toEqual('07')
    })

    test('returns the proper hours, minutes and seconds with high values', () => {
      applicationObject.applicantRevealExpiresAt = 202183
      timeLeft = applicationTimeLeft(currentTime, applicationObject, applicationState)

      expect(timeLeft.hours).toEqual('53')
      expect(timeLeft.minutes).toEqual('23')
      expect(timeLeft.seconds).toEqual('03')
    })

    test('returns 0 when time is up', () => {
      applicationObject.applicantRevealExpiresAt = 9000
      timeLeft = applicationTimeLeft(currentTime, applicationObject, applicationState)

      expect(timeLeft.hours).toEqual('00')
      expect(timeLeft.minutes).toEqual('00')
      expect(timeLeft.seconds).toEqual('00')
    })

    test('returns undefined when nothing is provided', () => {
      applicationObject.applicantRevealExpiresAt = undefined
      timeLeft = applicationTimeLeft(currentTime, applicationObject, applicationState)

      expect(timeLeft.hours).toEqual(undefined)
      expect(timeLeft.minutes).toEqual(undefined)
      expect(timeLeft.seconds).toEqual(undefined)
    })

  })

  describe('#waitingOnVerifier', () => {

    test('returns the proper hours, minutes and seconds for verifiers', () => {
      applicationState.waitingOnVerifier = true
      applicationState.needsApplicantReveal = false
      applicationObject.verifierSubmitSecretExpiresAt = 123800
      timeLeft = applicationTimeLeft(currentTime, applicationObject, applicationState)

      expect(timeLeft.hours).toEqual('31')
      expect(timeLeft.minutes).toEqual('36')
      expect(timeLeft.seconds).toEqual('40')
    })

    test('returns the proper hours, minutes and seconds with higher values', () => {
      applicationState.waitingOnVerifier = true
      applicationState.needsApplicantReveal = false
      applicationObject.verifierSubmitSecretExpiresAt = 12768200
      timeLeft = applicationTimeLeft(currentTime, applicationObject, applicationState)

      expect(timeLeft.hours).toEqual('3543')
      expect(timeLeft.minutes).toEqual('56')
      expect(timeLeft.seconds).toEqual('40')
    })

  })

})
