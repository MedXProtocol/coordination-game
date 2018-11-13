export const loadingStatus = function (state, { type }) {
  if (typeof state === 'undefined') {
    state = {
      showLoadingStatus: false
    }
  }

  switch(type) {
    case 'SHOW_LOADING_STATUS':
      state = {
        ...state,
        showLoadingStatus: true
      }
      break

    case 'HIDE_LOADING_STATUS':
      state = {
        ...state,
        showLoadingStatus: false
      }
      break

    // no default
  }

  return state
}
