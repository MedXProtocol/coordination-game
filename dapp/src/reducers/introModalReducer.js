export const introModal = function (state, { type }) {
  if (typeof state === 'undefined') {
    state = {
      showIntroModal: true
    }
  }

  switch(type) {
    case 'HIDE_INTRO_MODAL':
      state = {
        ...state,
        showIntroModal: false
      }
      break

    case 'SHOW_INTRO_MODAL':
      state = {
        ...state,
        showIntroModal: true
      }
      break

    // no default
  }

  return state
}
