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

    const object = {
      applicationId: application.applicantsLastApplicationId,
      random: state.random.toString(),
      hint: `${state.tokenTicker.trim()} - $${state.tokenName.trim()}`,
      secret: state.secret
    }

    localStorage.setItem(key, JSON.stringify(object))
  } else {
    console.warn("Unable to write to localStorage, doesn't exist or no access!")
  }
}
