import { storageAvailable } from '~/services/storageAvailable'

export const storeKeyValInLocalStorage = (key, val) => {
  if (storageAvailable('localStorage')) {
    const success = localStorage.setItem(key, val)
    console.log('success', success)
  } else {
    console.warn("Unable to write to localStorage, doesn't exist or no access!")
  }
}
