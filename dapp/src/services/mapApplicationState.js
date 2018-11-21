import { defined } from '~/utils/defined'
import { isBlank } from '~/utils/isBlank'

export function mapApplicationState (address, applicationObject, latestBlockTimestamp) {
  const {
    applicantRevealExpiresAt,
    applicantsSecret,
    applicant,
    tokenTicker,
    tokenName,
    random,
    secret,
    verifierChallengedAt,
    verifier,
    verifiersSecret,
    verifierSubmitSecretExpiresAt,
    whistleblower
  } = applicationObject

  const isApplicant = applicant === address
  const isVerifier = verifier === address

  const verifierSubmittedSecret = !isBlank(verifiersSecret)
  const applicantRevealedSecret = !isBlank(applicantsSecret)
  const applicantWon = (applicantsSecret === verifiersSecret)

  const waitingOnVerifier = (!isBlank(verifier) && !verifierSubmittedSecret)
  const needsApplicantReveal = (
    !applicantRevealedSecret &&
    verifierSubmittedSecret &&
    defined(random) &&
    defined(secret)
  )

  const verifierHasChallenged = (verifierChallengedAt !== 0)
  const applicantMissedRevealDeadline = (
    !applicantRevealedSecret &&
    verifierSubmittedSecret &&
    (latestBlockTimestamp > applicantRevealExpiresAt)
  )

  const needsAVerifier = (
    isBlank(verifier) &&
    defined(tokenTicker) &&
    defined(tokenName) &&
    defined(secret) &&
    defined(random)
  )

  const needsNewVerifier = (
    !isBlank(verifier) &&
    !verifierSubmittedSecret &&
    (latestBlockTimestamp > verifierSubmitSecretExpiresAt)
  )

  const noWhistleblower = isBlank(whistleblower)
  const canWhistleblow = !applicantRevealedSecret && noWhistleblower && !isApplicant

  const canVerify = (
    isVerifier &&
    !verifierSubmittedSecret &&
    noWhistleblower &&
    !verifierHasChallenged
  )

  const canChallenge = (
    isVerifier &&
    applicantMissedRevealDeadline &&
    noWhistleblower &&
    !verifierHasChallenged
  )

  const isComplete = (
    (verifierSubmittedSecret && applicantRevealedSecret) ||
    !noWhistleblower
  )

  // priority can be from 0 to 5, and states how important this (5 is highest importance)
  let priority = 2
  if (canVerify || (needsApplicantReveal && isApplicant)) {
    priority = 5
  } else if (canChallenge) {
    priority = 4
  } else if (isApplicant && (needsAVerifier || needsNewVerifier)) {
    priority = 3
  } else if (isComplete) {
    priority = 0
  }

  return {
    applicantMissedRevealDeadline,
    applicantRevealedSecret,
    applicantWon,
    canChallenge,
    canVerify,
    canWhistleblow,
    isApplicant,
    isVerifier,
    isComplete,
    needsApplicantReveal,
    needsAVerifier,
    needsNewVerifier,
    noWhistleblower,
    priority,
    waitingOnVerifier,
    verifierHasChallenged,
    verifierSubmittedSecret,
  }
}
