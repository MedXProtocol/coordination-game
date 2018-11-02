import { combineReducers } from 'redux'
import { reducers as sagaGenesis } from 'saga-genesis'
import { reducer as toastr } from 'react-redux-toastr'
import { betaFaucet } from './betaFaucetReducer'
import { externalTransactions } from './externalTransactionsReducer'
import { verifier } from './verifierReducer'

export default combineReducers({
  betaFaucet,
  externalTransactions,
  verifier,
  toastr,
  sagaGenesis
})
