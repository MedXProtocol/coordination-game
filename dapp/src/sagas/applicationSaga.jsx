import { all } from 'redux-saga/effects'
import { cacheCall } from 'saga-genesis'

export const applicationSaga = function*({
  coordinationGameAddress,
  applicationId
}) {
  if (!coordinationGameAddress || !applicationId) { return }

  yield all([
    cacheCall(coordinationGameAddress, 'games', applicationId),
    cacheCall(coordinationGameAddress, 'verifications', applicationId),
    cacheCall(coordinationGameAddress, 'applicantRevealTimeoutInSeconds'),
    cacheCall(coordinationGameAddress, 'verifierTimeoutInSeconds')
  ])
}
