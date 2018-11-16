import { cacheCallValue, cacheCallValueInt } from 'saga-genesis'
import { get } from 'lodash'
import { retrieveApplicationDetailsFromLocalStorage } from '~/services/retrieveApplicationDetailsFromLocalStorage'
import { hexHintToTokenData } from '~/utils/hexHintToTokenData'

export const applicationService = function(state, applicationId, coordinationGameAddress) {
  let applicationObject

  const networkId = get(state, 'sagaGenesis.network.networkId')
  const address = get(state, 'sagaGenesis.accounts[0]')

  const applicantRevealTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'applicantRevealTimeoutInSeconds')
  const verifierTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'verifierTimeoutInSeconds')

  const hexHint = cacheCallValue(state, coordinationGameAddress, 'hints', applicationId)

  // Parse and convert the generic hint field to our DApp-specific data
  const [tokenTicker, tokenName] = hexHintToTokenData(hexHint)

  const createdAt = cacheCallValueInt(state, coordinationGameAddress, 'createdAt', applicationId)
  const updatedAt = cacheCallValueInt(state, coordinationGameAddress, 'updatedAt', applicationId)
  const verifierSubmittedAt = cacheCallValueInt(state, coordinationGameAddress, 'verifierSubmittedAt', applicationId)
  const verifierChallengedAt = cacheCallValueInt(state, coordinationGameAddress, 'verifierChallengedAt', applicationId)

  const verifiersSecret = cacheCallValue(state, coordinationGameAddress, 'verifierSecrets', applicationId)
  const applicantsSecret = cacheCallValue(state, coordinationGameAddress, 'applicantSecrets', applicationId)
  const whistleblower = cacheCallValue(state, coordinationGameAddress, 'whistleblowers', applicationId)

  const applicantRevealExpiresAt      = verifierSubmittedAt + applicantRevealTimeoutInSeconds
  const verifierSubmitSecretExpiresAt = updatedAt + verifierTimeoutInSeconds

  applicationObject = {
    applicationId,
    applicantsSecret,
    applicantRevealExpiresAt,
    createdAt,
    updatedAt,
    tokenTicker,
    tokenName,
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
