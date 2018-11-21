import { get, range } from 'lodash'
import {
  cacheCallValue,
  contractByName
} from 'saga-genesis'
import { isBlank } from '~/utils/isBlank'

export const verifierApplicationsService = function(state, startIndex, endIndex) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')

  // The -1 logic here is weird, range is exclusive not inclusive:
  if (!endIndex) {
    endIndex = -1
  }
  // console.log(startIndex, endIndex)

  return range(startIndex, endIndex).reduce((accumulator, index) => {
    const applicationId = cacheCallValue(
      state,
      coordinationGameAddress,
      "verifiersApplicationIndices",
      address,
      index
    )

    if (!isBlank(applicationId)) {
      accumulator.push(applicationId)
    }

    return accumulator
  }, [])
}
