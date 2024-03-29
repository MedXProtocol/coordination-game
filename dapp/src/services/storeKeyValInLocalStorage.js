import { storageAvailable } from '~/services/storageAvailable'

export const storeKeyValInLocalStorage = (key, val) => {
  if (storageAvailable('localStorage')) {
    localStorage.setItem(key, val)
  } else {
    console.warn("Unable to write to localStorage, doesn't exist or no access!")
  }
}
