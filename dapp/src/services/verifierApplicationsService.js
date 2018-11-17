import { get, range } from 'lodash'
import { cacheCallValue } from 'saga-genesis'
import { isBlank } from '~/utils/isBlank'

export const verifierApplicationsService = function(state, applicationCount, coordinationGameAddress) {
  const address = get(state, 'sagaGenesis.accounts[0]')

  // The -1 logic here is weird, range is exclusive not inclusive:
  return range(applicationCount, -1).reduce((accumulator, index) => {
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
