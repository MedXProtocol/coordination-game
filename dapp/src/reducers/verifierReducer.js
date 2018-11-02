export const verifier = function (state, {
  type,
  applicationId
}) {
  if (typeof state === 'undefined') {
    state = {
      applicationId: null
    }
  }

  switch (type) {
    case 'SHOW_VERIFY_APPLICATION':
      state = {
        ...state,
        applicationId
      }
      break

    case 'HIDE_VERIFY_APPLICATION':
      state = {
        ...state,
        applicationId: null
      }
      break

    // no default
  }

  return state
}
