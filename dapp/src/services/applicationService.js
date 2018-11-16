import { cacheCallValue, cacheCallValueInt } from 'saga-genesis'
import { get } from 'lodash'
import { retrieveApplicationDetailsFromLocalStorage } from '~/services/retrieveApplicationDetailsFromLocalStorage'
import { hexHintToTokenData } from '~/utils/hexHintToTokenData'
import { isBlank } from '~/utils/isBlank'

export const applicationService = function(state, applicationId, coordinationGameAddress) {
  let applicationObject,
    applicantRevealExpiresAt,
    verifierSubmitSecretExpiresAt,
    verifierSubmittedAt,
    verifierChallengedAt,
    verifiersSecret

  const networkId = get(state, 'sagaGenesis.network.networkId')
  const address = get(state, 'sagaGenesis.accounts[0]')

  const verifier = cacheCallValue(state, coordinationGameAddress, 'verifiers', applicationId)

  const hexHint = cacheCallValue(state, coordinationGameAddress, 'hints', applicationId)

  // Parse and convert the generic hint field to our DApp-specific data
  const [tokenTicker, tokenName] = hexHintToTokenData(hexHint)

  const createdAt = cacheCallValueInt(state, coordinationGameAddress, 'createdAt', applicationId)
  const updatedAt = cacheCallValueInt(state, coordinationGameAddress, 'updatedAt', applicationId)

  const applicantsSecret = cacheCallValue(state, coordinationGameAddress, 'applicantSecrets', applicationId)
  const whistleblower = cacheCallValue(state, coordinationGameAddress, 'whistleblowers', applicationId)

  if (!isBlank(verifier)) {
    const applicantRevealTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'applicantRevealTimeoutInSeconds')
    const verifierTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'verifierTimeoutInSeconds')

    applicantRevealExpiresAt      = verifierSubmittedAt + applicantRevealTimeoutInSeconds
    verifierSubmitSecretExpiresAt = updatedAt + verifierTimeoutInSeconds

    verifierSubmittedAt = cacheCallValueInt(state, coordinationGameAddress, 'verifierSubmittedAt', applicationId)
    verifierChallengedAt = cacheCallValueInt(state, coordinationGameAddress, 'verifierChallengedAt', applicationId)

    verifiersSecret = cacheCallValue(state, coordinationGameAddress, 'verifierSecrets', applicationId)
  }

  applicationObject = {
    applicationId,
    applicantsSecret,
    applicantRevealExpiresAt,
    createdAt,
    updatedAt,
    tokenTicker,
    tokenName,
    verifier,
    verifiersSecret,
    verifierChallengedAt,
    verifierSubmittedAt,
    verifierSubmitSecretExpiresAt,
    whistleblower
  }

  applicationObject = retrieveApplicationDetailsFromLocalStorage(
    applicationObject,
    networkId,
    address,
    createdAt
  )

  return applicationObject
}
