import { cacheCallValue, cacheCallValueInt } from 'saga-genesis'
import { get } from 'lodash'
import { retrieveApplicationDetailsFromLocalStorage } from '~/services/retrieveApplicationDetailsFromLocalStorage'
import { hexHintToTokenData } from '~/utils/hexHintToTokenData'
import { isBlank } from '~/utils/isBlank'
import { mapToGame } from '~/services/mapToGame'
import { mapToVerification } from '~/services/mapToVerification'
import { bytes32ToTicker } from '~/utils/bytes32ToTicker'

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
    randomBlockNumber,
    whistleblower,
    updatedAt
  } = game

  const {
    verifier,
    verifierSubmittedAt,
    verifierChallengedAt
  } = verification

  const hexHint = game.hint
  // Parse and convert the generic hint field to our DApp-specific data
  const tokenName = hexHintToTokenData(hexHint)
  const tokenTicker = bytes32ToTicker(applicationId)

  const applicant = game.applicant
  const applicantsSecret = game.applicantSecret

  const applicantRevealTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'applicantRevealTimeoutInSeconds')
  const verifierTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'verifierTimeoutInSeconds')

  if (!isBlank(verifier)) {
    applicantRevealExpiresAt      = verifierSubmittedAt + applicantRevealTimeoutInSeconds
    verifierSubmitSecretExpiresAt = updatedAt + verifierTimeoutInSeconds

    verifiersSecret = verification.verifierSecret
  }

  applicationObject = {
    applicant,
    applicationId,
    applicantsSecret,
    applicantRevealExpiresAt,
    createdAt,
    game,
    randomBlockNumber,
    tokenTicker,
    tokenName,
    verifier,
    verifiersSecret,
    verifierChallengedAt,
    verifierSubmittedAt,
    verifierSubmitSecretExpiresAt,
    whistleblower,
    updatedAt
  }

  applicationObject = retrieveApplicationDetailsFromLocalStorage(
    applicationObject,
    networkId,
    address,
    createdAt
  )

  return applicationObject
}
