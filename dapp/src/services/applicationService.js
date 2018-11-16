import { cacheCallValue, cacheCallValueInt } from 'saga-genesis'
import { get } from 'lodash'
import { retrieveApplicationDetailsFromLocalStorage } from '~/services/retrieveApplicationDetailsFromLocalStorage'
import { hexHintToTokenData } from '~/utils/hexHintToTokenData'
import { isBlank } from '~/utils/isBlank'
import { mapToGame } from '~/services/mapToGame'
import { mapToVerification } from '~/services/mapToVerification'

export const applicationService = function(state, applicationId, coordinationGameAddress) {
  let applicationObject,
    applicantRevealExpiresAt,
    verifierSubmitSecretExpiresAt,
    verifiersSecret

  const networkId = get(state, 'sagaGenesis.network.networkId')
  const address = get(state, 'sagaGenesis.accounts[0]')

  const game = mapToGame(cacheCallValue(state, coordinationGameAddress, 'games', applicationId))
  const verification = mapToVerification(cacheCallValue(state, coordinationGameAddress, 'verifications', applicationId))

  const {
    createdAt,
    updatedAt,
    whistleblower
  } = game

  const {
    verifier,
    verifierSubmittedAt,
    verifierChallengedAt
  } = verification

  const hexHint = game.hint
  // Parse and convert the generic hint field to our DApp-specific data
  const [tokenTicker, tokenName] = hexHintToTokenData(hexHint)

  const applicantsSecret = game.applicantSecret

  const applicantRevealTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'applicantRevealTimeoutInSeconds')
  const verifierTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'verifierTimeoutInSeconds')

  if (!isBlank(verifier)) {
    applicantRevealExpiresAt      = verifierSubmittedAt + applicantRevealTimeoutInSeconds
    verifierSubmitSecretExpiresAt = updatedAt + verifierTimeoutInSeconds

    verifiersSecret = verification.verifierSecret
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