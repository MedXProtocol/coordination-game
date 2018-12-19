import { all } from 'redux-saga/effects'
import { cacheCall } from 'saga-genesis'

export const applicationSaga = function*({
  coordinationGameAddress,
  applicationId,
  tilRegistryAddress
}) {
  if (!coordinationGameAddress || !tilRegistryAddress || !applicationId) { return }

  yield all([
    cacheCall(tilRegistryAddress, 'listings', applicationId),
    cacheCall(coordinationGameAddress, 'games', applicationId),
    cacheCall(coordinationGameAddress, 'verifications', applicationId),
    cacheCall(coordinationGameAddress, 'applicantRevealTimeoutInSeconds'),
    cacheCall(coordinationGameAddress, 'verifierTimeoutInSeconds')
  ])
}
