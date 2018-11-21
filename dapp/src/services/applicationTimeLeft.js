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
    seconds,
    totalSecondsRemaining

  totalSecondsRemaining = calculateSecondsRemaining(currentTime, applicationObject, applicationState)

  if (totalSecondsRemaining <= 0) {
    hours = `00`, minutes = `00`, seconds = `00`
  } else if (totalSecondsRemaining) {
    hours   = parseInt((totalSecondsRemaining / 3600), 10)
    minutes = parseInt((totalSecondsRemaining / 60) % 60, 10)
    seconds = parseInt((totalSecondsRemaining / 60 * 60) % 60, 10)

    hours   = hours   < 10 ? `0${hours}`   : hours.toString()
    minutes = minutes < 10 ? `0${minutes}` : minutes.toString()
    seconds = seconds < 10 ? `0${seconds}` : seconds.toString()

    totalSecondsRemaining
  }

  return {
    hours,
    minutes,
    seconds,
    totalSecondsRemaining
  }
}
