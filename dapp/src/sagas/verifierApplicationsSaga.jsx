import { range } from 'lodash'
import { all } from 'redux-saga/effects'
import { cacheCall } from 'saga-genesis'

export const verifierApplicationsSaga = function*(
  coordinationGameAddress,
  address,
  applicationCount
) {
  if (!coordinationGameAddress || !address) { return null }

  yield cacheCall(coordinationGameAddress, 'getVerifiersApplicationCount')

  if (applicationCount && applicationCount !== 0) {
    const indices = range(applicationCount)
    yield all(
      indices.map(function*(index) {
        yield cacheCall(coordinationGameAddress, "verifiersApplicationIndices", address, index)
      })
    )
  }
}
