import {
  fork,
  takeEvery,
  put
} from 'redux-saga/effects'
import { sagas, takeOnceAndRun } from 'saga-genesis'
import { addContractsSaga } from './addContractsSaga'
import { customProviderWeb3 } from '~/utils/customProviderWeb3'
import { sagaMiddleware } from '~/sagaMiddleware'

function* catchSagaGenesisErrorSaga(error) {
  yield console.error(error)
}

export default function* () {
  yield fork(takeOnceAndRun, 'WEB3_NETWORK_ID', function* ({ web3, networkId }) {

    const readWeb3 = customProviderWeb3(networkId)
    sagaMiddleware.setContext({ readWeb3 })

    yield addContractsSaga({ web3 })

    // Add your custom config settings here:
    yield put({ type: 'SG_UPDATE_SAGA_GENESIS_CONFIG', numConfirmationsRequired: 2 })
  })

  yield takeEvery('SAGA_GENESIS_CAUGHT_ERROR', catchSagaGenesisErrorSaga)
  yield sagas()
}
