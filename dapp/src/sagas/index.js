import {
  fork,
  takeEvery,
  setContext
} from 'redux-saga/effects'
import { sagas, takeOnceAndRun } from 'saga-genesis'
import { addContractsSaga } from './addContractsSaga'

export default function* () {
  yield fork(takeOnceAndRun, 'WEB3_NETWORK_ID', function* ({ web3, networkId }) {
    yield setContext({ web3 })
    yield addContractsSaga({ web3 })
  })
  yield takeEvery('SAGA_GENESIS_CAUGHT_ERROR', catchSagaGenesisErrorSaga)
  yield sagas()
}

function* catchSagaGenesisErrorSaga(error) {
  yield console.log(error)
}
