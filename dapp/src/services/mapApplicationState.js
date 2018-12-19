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

export function mapApplicationState(
  address,
  applicationObject,
  latestBlockNumber,
  latestBlockTimestamp
) {
  let priority = DEFAULT_PRIORITY

  const {
    applicantRevealExpiresAt,
    applicantsSecret,
    applicant,
    randomBlockNumber,
    verifierChallengedAt,
    verifier,
    verifiersSecret,
    verifierSubmitSecretExpiresAt,
    whistleblower
  } = applicationObject

  const waitingOnBlockToMine = (latestBlockNumber < parseInt(randomBlockNumber, 10))

  const isApplicant = applicant === address
  const isVerifier = verifier === address

  const verifierSubmittedSecret = !isBlank(verifiersSecret)
  const applicantRevealedSecret = !isBlank(applicantsSecret)
  const applicantWon = (applicantsSecret === verifiersSecret)

  const needsAVerifier = isBlank(verifier)
  const waitingOnVerifier = (!isBlank(verifier) && !verifierSubmittedSecret)
  const verifierHasChallenged = (defined(verifierChallengedAt) && verifierChallengedAt !== 0)

  const needsApplicantReveal = (
    !applicantRevealedSecret &&
    verifierSubmittedSecret
  )

  const applicantMissedRevealDeadline = (
    needsApplicantReveal &&
    (latestBlockTimestamp > applicantRevealExpiresAt)
  )

  const needsNewVerifier = (
    waitingOnVerifier &&
    (latestBlockTimestamp > verifierSubmitSecretExpiresAt)
  )

  const noWhistleblower = isBlank(whistleblower)
  const canWhistleblow = (
    !isApplicant &&
    !verifierSubmittedSecret
    && noWhistleblower
  )

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
    applicantRevealedSecret ||
    verifierHasChallenged ||
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
    waitingOnBlockToMine,
    waitingOnVerifier,
    verifierHasChallenged,
    verifierSubmittedSecret,
  }
}
