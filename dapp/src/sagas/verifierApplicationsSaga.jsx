import { range } from 'lodash'
import { all } from 'redux-saga/effects'
import { cacheCall } from 'saga-genesis'

export const verifierApplicationsSaga = function*({
  coordinationGameAddress,
  address
}) {
  if (!coordinationGameAddress || !address) { return null }

  const applicationCount = yield cacheCall(coordinationGameAddress, 'getVerifiersApplicationCount', address)

  if (applicationCount && applicationCount !== 0) {
    const indices = range(applicationCount)
    yield all(
      indices.map(function*(index) {
        yield cacheCall(coordinationGameAddress, "getVerifiersApplicationAtIndex", address, index)
      })
    )
  }
}
