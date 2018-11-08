import { combineReducers } from 'redux'
import { reducers as sagaGenesis } from 'saga-genesis'
import { reducer as toastr } from 'react-redux-toastr'
import { betaFaucet } from './betaFaucetReducer'
import { faqModal } from './faqModalReducer'
import { externalTransactions } from './externalTransactionsReducer'

export default combineReducers({
  betaFaucet,
  externalTransactions,
  faqModal,
  toastr,
  sagaGenesis
})
