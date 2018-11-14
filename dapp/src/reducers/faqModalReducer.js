export const faqModal = function (state, { type }) {
  if (typeof state === 'undefined') {
    state = {
      showFaqModal: true
    }
  }

  switch(type) {
    case 'HIDE_FAQ_MODAL':
      state = {
        ...state,
        showFaqModal: false
      }
      break

    case 'SHOW_FAQ_MODAL':
      state = {
        ...state,
        showFaqModal: true
      }
      break

    // no default
  }

  return state
}
