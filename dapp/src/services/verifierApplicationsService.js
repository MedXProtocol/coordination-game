import { get, range } from 'lodash'
import {
  cacheCallValue,
  contractByName
} from 'saga-genesis'
import { applicationService } from '~/services/applicationService'
import { mapApplicationState } from '~/services/mapApplicationState'
import { mapToGame } from '~/services/mapToGame'
import { isBlank } from '~/utils/isBlank'

export const verifierApplicationsService = function(state, startIndex, endIndex) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const tilRegistryAddress = contractByName(state, 'TILRegistry')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const latestBlockNumber = get(state, 'sagaGenesis.block.latestBlock.number')

  // The -1 logic here is weird, range is exclusive not inclusive:
  if (!endIndex) {
    endIndex = -1
  }
  // console.log(startIndex, endIndex)

  return range(startIndex, endIndex).reduce((accumulator, index) => {
    const applicationId = cacheCallValue(
      state,
      coordinationGameAddress,
      "getVerifiersApplicationAtIndex",
      address,
      index
    )

    if (!isBlank(applicationId)) {
      const game = mapToGame(cacheCallValue(state, coordinationGameAddress, 'games', applicationId))
      const { createdAt, updatedAt } = game

      const applicationObject = applicationService(state, applicationId, coordinationGameAddress, tilRegistryAddress)
      const applicationState = mapApplicationState(
        address,
        applicationObject,
        latestBlockNumber,
        latestBlockTimestamp
      )

      const { verifierSubmittedAt } = applicationObject
      const { priority } = applicationState

      accumulator.push({ applicationId, createdAt, updatedAt, verifierSubmittedAt, priority })
    }

    return accumulator
  }, [])
}
