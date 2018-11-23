import { combineReducers } from 'redux'
import { reducers as sagaGenesis } from 'saga-genesis'
import { reducer as toastr } from 'react-redux-toastr'
import { betaFaucet } from './betaFaucetReducer'
import { introModal } from './introModalReducer'
import { loadingStatus } from './loadingStatusReducer'
import { search } from './searchReducer'

export default combineReducers({
  betaFaucet,
  introModal,
  loadingStatus,
  search,
  toastr,
  sagaGenesis
})
