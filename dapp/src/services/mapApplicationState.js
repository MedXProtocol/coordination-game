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

  const verifierSubmittedSecret = !isBlank(verifiersSecret)
  const applicantRevealedSecret = !isBlank(applicantsSecret)
  const applicantWon = (applicantsSecret === verifiersSecret)

  const success = applicantRevealedSecret
  const waitingOnVerifier = (!isBlank(verifier) && !verifierSubmittedSecret)
  const needsApplicantReveal = (verifierSubmittedSecret && defined(random) && defined(secret))

  const verifierHasChallenged = (verifierChallengedAt !== 0)
  const applicantMissedRevealDeadline = (
    verifierSubmittedSecret && (latestBlockTimestamp > applicantRevealExpiresAt)
  )

  const needsAVerifier = (isBlank(verifier) && defined(tokenTicker) && defined(tokenName) && defined(secret) && defined(random))
  const needsNewVerifier = (!isBlank(verifier) && (latestBlockTimestamp > verifierSubmitSecretExpiresAt))

  const isApplicant = applicant === address
  const secretNotRevealed = isBlank(applicantsSecret)
  const noWhistleblower = isBlank(whistleblower)
  const canWhistleblow = waitingOnVerifier && secretNotRevealed && noWhistleblower && !isApplicant

  return {
    verifierSubmittedSecret,
    applicantRevealedSecret,
    applicantWon,
    success,
    waitingOnVerifier,
    needsApplicantReveal,
    verifierHasChallenged,
    applicantMissedRevealDeadline,
    needsAVerifier,
    needsNewVerifier,
    isApplicant,
    secretNotRevealed,
    noWhistleblower,
    canWhistleblow
  }
}
