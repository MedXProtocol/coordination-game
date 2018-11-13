import { applicationStorageKey } from '~/utils/applicationStorageKey'
import { storageAvailable } from '~/services/storageAvailable'

export const storeApplicationDetailsInLocalStorage = (
  application,
  state
) => {
  if (storageAvailable('localStorage')) {
    const key = applicationStorageKey(
      application.networkId,
      application.address,
      application.applicantsLastApplicationCreatedAt
    )

    // console.log('in storeApplicationDetailsInLocalStorage', state.random, state.random.toString())

    const object = {
      applicationId: application.applicantsLastApplicationId,
      random: state.random.toString(),
      hint: `${state.hintLeft} + ${state.hintRight}`,
      secret: state.secret
    }

    localStorage.setItem(key, JSON.stringify(object))
  } else {
    console.warn("Unable to write to localStorage, doesn't exist or no access!")
  }
}
