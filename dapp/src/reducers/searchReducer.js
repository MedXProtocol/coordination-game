export const search = function (state, { type, query }) {
  if (typeof state === 'undefined') {
    state = {
      query: undefined
    }
  }

  switch(type) {
    case 'UPDATE_SEARCH_QUERY':
      state = {
        ...state,
        query
      }
      break

    case 'CLEAR_SEARCH_QUERY':
      state = {
        ...state,
        query: undefined
      }
      break

    // no default
  }

  return state
}
