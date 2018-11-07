import { storageAvailable } from '~/services/storageAvailable'

export const retrieveKeyValFromLocalStorage = (key) => {
  let val = ''

  if (storageAvailable('localStorage')) {
    val = localStorage.getItem(key)
  } else {
    console.error("Unable to read from localStorage, doesn't exist or no access!")
  }

  return val
}
