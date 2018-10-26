export const betaFaucet = function (state, { type, manuallyOpened, step }) {
  if (typeof state === 'undefined') {
    state = {
      betaFaucetModalDismissed: false,
      manuallyOpened: false,
      step: 1
    }
  }

  switch(type) {
    case 'HIDE_BETA_FAUCET_MODAL':
      state = {
        ...state,
        betaFaucetModalDismissed: true,
        manuallyOpened
      }
      break

    case 'SET_BETA_FAUCET_MODAL_STEP':
      state = {
        ...state,
        step
      }
      break

    case 'SHOW_BETA_FAUCET_MODAL':
      state = {
        ...state,
        step: 1,
        betaFaucetModalDismissed: false,
        manuallyOpened
      }
      break

    case 'SIGNED_OUT':
      state = {}
      break

    // no default
  }

  return state
}
