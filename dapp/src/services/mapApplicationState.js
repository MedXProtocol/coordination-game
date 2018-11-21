import { defined } from '~/utils/defined'
import { isBlank } from '~/utils/isBlank'

const PRIORITIES = {
  low: 1,
  medium: 2,
  high: 3,
  veryHigh: 4,
  superImportant: 5
}

const DEFAULT_PRIORITY = PRIORITIES['medium']

export function mapApplicationState (address, applicationObject, latestBlockTimestamp) {
  let priority = DEFAULT_PRIORITY

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

  // priority can be from 1 to 5, and states how important this (5 is highest importance)
  if (canVerify || (needsApplicantReveal && isApplicant)) {
    priority = PRIORITIES['superImportant']
  } else if (canChallenge) {
    priority = PRIORITIES['veryHigh']
  } else if (isApplicant && (needsAVerifier || needsNewVerifier)) {
    priority = PRIORITIES['high']
  } else if (isComplete) {
    priority = PRIORITIES['low']
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
