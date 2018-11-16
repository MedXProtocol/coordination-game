import { all } from 'redux-saga/effects'
import { cacheCall } from 'saga-genesis'

export const applicationSaga = function*({
  coordinationGameAddress,
  applicationId
}) {
  if (!coordinationGameAddress || !applicationId) { return }

  yield all([
    cacheCall(coordinationGameAddress, 'hints', applicationId),
    cacheCall(coordinationGameAddress, 'verifiers', applicationId),
    cacheCall(coordinationGameAddress, 'verifierChallengedAt', applicationId),
    cacheCall(coordinationGameAddress, 'verifierSubmittedAt', applicationId),
    cacheCall(coordinationGameAddress, 'createdAt', applicationId),
    cacheCall(coordinationGameAddress, 'updatedAt', applicationId),
    cacheCall(coordinationGameAddress, 'verifierSecrets', applicationId),
    cacheCall(coordinationGameAddress, 'applicantSecrets', applicationId),
    cacheCall(coordinationGameAddress, 'applicantRevealTimeoutInSeconds'),
    cacheCall(coordinationGameAddress, 'verifierTimeoutInSeconds'),
    cacheCall(coordinationGameAddress, 'whistleblowers', applicationId)
  ])
}
