function calculateSecondsRemaining(currentTime, applicationObject, applicationState) {
  let secondsRemaining

  if (applicationState.needsApplicantReveal && applicationObject.applicantRevealExpiresAt) {
    secondsRemaining = (applicationObject.applicantRevealExpiresAt - currentTime)
  } else if (applicationState.waitingOnVerifier && applicationObject.verifierSubmitSecretExpiresAt) {
    secondsRemaining = (applicationObject.verifierSubmitSecretExpiresAt - currentTime)
  }

  return secondsRemaining
}

export const applicationTimeLeft = function(currentTime, applicationObject, applicationState) {
  let hours,
    minutes,
    seconds

  seconds = calculateSecondsRemaining(currentTime, applicationObject, applicationState)

  if (!seconds) {
    console.log('blank')
    return ''
  } else if (seconds < 0) {
    console.log(seconds)
    console.log('here')
    return '0:00'
  }

  hours = parseInt(((seconds % (24 * 3600)) / 3600), 10)
  minutes = parseInt(((seconds % 3600) / 60), 10)

  if (hours < 10) {
    hours = `0${hours}`
  }
  if (minutes < 10) {
    minutes = `0${minutes}`
  }

  return {
    hours,
    minutes,
    seconds
  }
}
