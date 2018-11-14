import { cacheCallValue, cacheCallValueInt } from 'saga-genesis'

export const verifierApplicationService = function(state, applicationId, coordinationGameAddress) {
  const applicantRevealTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'applicantRevealTimeoutInSeconds')
  const verifierTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'verifierTimeoutInSeconds')

  const createdAt = cacheCallValueInt(state, coordinationGameAddress, 'createdAt', applicationId)
  const updatedAt = cacheCallValueInt(state, coordinationGameAddress, 'updatedAt', applicationId)
  const verifierSubmittedAt = cacheCallValueInt(state, coordinationGameAddress, 'verifierSubmittedAt', applicationId)
  const verifierChallengedAt = cacheCallValueInt(state, coordinationGameAddress, 'verifierChallengedAt', applicationId)

  const verifiersSecret = cacheCallValue(state, coordinationGameAddress, 'verifierSecrets', applicationId)
  const applicantsSecret = cacheCallValue(state, coordinationGameAddress, 'applicantSecrets', applicationId)
  const whistleblower = cacheCallValue(state, coordinationGameAddress, 'whistleblowers', applicationId)

  const applicantRevealExpiresAt      = verifierSubmittedAt + applicantRevealTimeoutInSeconds
  const verifierSubmitSecretExpiresAt = updatedAt + verifierTimeoutInSeconds

  return {
    applicationId,
    applicantsSecret,
    applicantRevealExpiresAt,
    createdAt,
    updatedAt,
    verifiersSecret,
    verifierChallengedAt,
    verifierSubmittedAt,
    verifierSubmitSecretExpiresAt,
    whistleblower
  }
}
