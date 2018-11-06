import { applicationStorageKey } from '~/utils/applicationStorageKey'
import { storageAvailable } from '~/services/storageAvailable'
import { BN } from 'bn.js'

export const retrieveApplicationDetailsFromLocalStorage = (
  applicationRowObject,
  networkId,
  address,
  createdAt
) => {
  if (storageAvailable('localStorage')) {
    const key = applicationStorageKey(networkId, address, createdAt)
    const json = localStorage.getItem(key)

    if (json) {
      const object = JSON.parse(json)
      applicationRowObject = {
        ...applicationRowObject,
        random: new BN(object.random),
        secret: object.secret
      }

      return applicationRowObject
    } else {
      console.warn(`Value not found for key ${key} in localStorage`)
      return applicationRowObject
    }
  } else {
    console.warn("Unable to read from localStorage, doesn't exist or no access!")
    return applicationRowObject
  }
}
