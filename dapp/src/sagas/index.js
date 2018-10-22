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
  // yield put('SAGA_GENESIS_READY')
  yield sagas()
  // yield talkin()
}

function* catchSagaGenesisErrorSaga(error) {
  yield console.log(error)
}


// function* prepareSaga({ saga, props, key }) {
//   yield console.log('in here!', saga, props, key)
//   // const action = `RUN_SAGA_${key}`
//   // const task = yield takeLatest(action, runSaga)
//   // yield runSaga({ saga, props, key })
//   // yield take(`END_SAGA_${key}`)
//   // yield deregisterKey(key)
//   // yield cancel(task)
// }
//
// function* talkin() {
//   // yield takeEvery('TRANSACTION_CONFIRMED', invalidateTransaction)
//   // yield takeEvery('CACHE_INVALIDATE_ADDRESS', invalidateAddress)
//   yield takeEvery('PREPARE_SAGA', prepareSaga)
// }
