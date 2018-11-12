import { combineReducers } from 'redux'
import { reducers as sagaGenesis } from 'saga-genesis'
import { reducer as toastr } from 'react-redux-toastr'
import { betaFaucet } from './betaFaucetReducer'
import { faqModal } from './faqModalReducer'

export default combineReducers({
  betaFaucet,
  faqModal,
  toastr,
  sagaGenesis
})
