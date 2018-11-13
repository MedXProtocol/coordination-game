import { get, range } from 'lodash'
import { cacheCallValueInt } from 'saga-genesis'

export const verifierApplicationsService = function(state, applicationCount, coordinationGameAddress) {
  const address = get(state, 'sagaGenesis.accounts[0]')

  // The -1 logic here is weird, range is exclusive not inclusive:
  return range(applicationCount, -1).reduce((accumulator, index) => {
    const applicationId = cacheCallValueInt(
      state,
      coordinationGameAddress,
      "verifiersApplicationIndices",
      address,
      index
    )

    if (applicationId) {
      accumulator.push(applicationId)
    }

    return accumulator
  }, [])
}
