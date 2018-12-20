import {
  fork,
  takeEvery,
  put,
  setContext
} from 'redux-saga/effects'
import { sagas, takeOnceAndRun } from 'saga-genesis'
import { addContractsSaga } from './addContractsSaga'
import { customProviderWeb3 } from '~/utils/customProviderWeb3'

function* catchSagaGenesisErrorSaga(error) {
  yield console.log(error)
}

export default function* () {
  yield fork(takeOnceAndRun, 'WEB3_NETWORK_ID', function* ({ web3, networkId }) {
    yield setContext({ web3 })
    yield put({ type: 'SET_READ_WEB3', readWeb3: customProviderWeb3(networkId) })
    yield addContractsSaga({ web3 })

    // Add your custom config settings here:
    yield put({ type: 'SG_UPDATE_SAGA_GENESIS_CONFIG', numConfirmationsRequired: 2 })
  })
  yield takeEvery('SAGA_GENESIS_CAUGHT_ERROR', catchSagaGenesisErrorSaga)
  yield sagas()
}
