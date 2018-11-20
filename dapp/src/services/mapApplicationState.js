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
    verifierSubmittedSecret &&
    (latestBlockTimestamp > applicantRevealExpiresAt)
  )

  const needsAVerifier = (isBlank(verifier) && defined(tokenTicker) && defined(tokenName) && defined(secret) && defined(random))
  const needsNewVerifier = (!isBlank(verifier) && (latestBlockTimestamp > verifierSubmitSecretExpiresAt))

  const noWhistleblower = isBlank(whistleblower)
  const canWhistleblow = waitingOnVerifier && !applicantRevealedSecret && noWhistleblower && !isApplicant

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
    verifierSubmittedSecret && applicantRevealedSecret
  )

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
    waitingOnVerifier,
    verifierHasChallenged,
    verifierSubmittedSecret,
  }
}
