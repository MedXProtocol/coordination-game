import React, {
  PureComponent
} from 'react'
import {
  all
} from 'redux-saga/effects'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  cacheCallValueInt,
  contractByName
} from 'saga-genesis'
import { isBlank } from '~/utils/isBlank'
import { get } from 'lodash'
import { connect } from 'react-redux'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'

function mapStateToProps(state, { applicationId }) {
  const CoordinationGame = contractByName(state, 'CoordinationGame')

  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const updatedAt = cacheCallValueInt(state, CoordinationGame, 'updatedAt', applicationId)
  const applicantRevealTimeoutInSeconds = cacheCallValueInt(state, CoordinationGame, 'applicantRevealTimeoutInSeconds')
  const verifierTimeoutInSeconds = cacheCallValueInt(state, CoordinationGame, 'verifierTimeoutInSeconds')
  const verifierSubmittedAt = cacheCallValueInt(state, CoordinationGame, 'verifierSubmittedAt', applicationId)
  const verifierChallengedAt = cacheCallValueInt(state, CoordinationGame, 'verifierChallengedAt', applicationId)
  const verifiersSecret = cacheCallValue(state, CoordinationGame, 'verifierSecrets', applicationId)
  const applicantsSecret = cacheCallValue(state, CoordinationGame, 'applicantSecrets', applicationId)
  const whistleblower = cacheCallValue(state, CoordinationGame, 'whistleblowers', applicationId)

  return {
    CoordinationGame,
    latestBlockTimestamp,
    updatedAt,
    applicantRevealTimeoutInSeconds,
    verifierTimeoutInSeconds,
    verifierSubmittedAt,
    verifierChallengedAt,
    verifiersSecret,
    applicantsSecret,
    whistleblower
  }
}

function* applicationStatusSaga({ CoordinationGame, applicationId }) {
  if (!CoordinationGame || !applicationId) { return }
  yield all([
    cacheCall(CoordinationGame, 'updatedAt', applicationId),
    cacheCall(CoordinationGame, 'applicantRevealTimeoutInSeconds'),
    cacheCall(CoordinationGame, 'verifierTimeoutInSeconds'),
    cacheCall(CoordinationGame, 'verifierSubmittedAt', applicationId),
    cacheCall(CoordinationGame, 'verifierChallengedAt', applicationId),
    cacheCall(CoordinationGame, 'verifierSecrets', applicationId),
    cacheCall(CoordinationGame, 'applicantSecrets', applicationId),
    cacheCall(CoordinationGame, 'whistleblowers', applicationId)
  ])
}

export const ApplicationStatus = connect(mapStateToProps)(withSaga(applicationStatusSaga)(
  class _ApplicationStatus extends PureComponent {
    render () {
      const {
        latestBlockTimestamp,
        updatedAt,
        applicantRevealTimeoutInSeconds,
        verifierTimeoutInSeconds,
        verifierSubmittedAt,
        verifierChallengedAt,
        verifiersSecret,
        applicantsSecret,
        whistleblower
      } = this.props

      const applicantRevealedSecret = !isBlank(applicantsSecret)
      const verifierSubmittedSecret = !isBlank(verifiersSecret)
      const applicantWon = (applicantsSecret === verifiersSecret)
      const applicantRevealExpiresAt      = verifierSubmittedAt + applicantRevealTimeoutInSeconds
      const verifierSubmitSecretExpiresAt = updatedAt + verifierTimeoutInSeconds

      var expirationMessage

      if (!isBlank(whistleblower)) {
        expirationMessage = (
          <React.Fragment>
            Application Disqualified
            <br /><strong>Whistleblown!</strong>
          </React.Fragment>
        )
      } else if (applicantRevealedSecret) {
        expirationMessage = (
          <React.Fragment>
            Application Complete
            <br /><strong>{applicantWon ? `Contract addresses matched` : `Contract addresses did not match`}</strong>
          </React.Fragment>
        )
      } else if (!verifierSubmittedSecret && (latestBlockTimestamp > verifierSubmitSecretExpiresAt)) {
        expirationMessage = <span className="has-text-grey">The verify deadline has passed.</span>
      } else if (!verifierSubmittedSecret) {
        expirationMessage = (
          <React.Fragment>
            <span className="has-text-grey">Verification required before:</span>
            <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={verifierSubmitSecretExpiresAt} />
          </React.Fragment>
        )
      } else if (verifierSubmittedSecret) {
        if (latestBlockTimestamp > applicantRevealExpiresAt) {
          if (verifierChallengedAt === 0) {
            expirationMessage = (
              <React.Fragment>
                <span className="has-text-grey">Applicant failed to reveal secret</span>
              </React.Fragment>
            )
          } else {
            expirationMessage = (
              <React.Fragment>
                <span className="has-text-grey">The application was successfully challenged</span>
              </React.Fragment>
            )
          }
        } else {
          expirationMessage = (
            <React.Fragment>
              <span className="has-text-grey">Waiting on applicant to reveal secret before:</span>
              <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={applicantRevealExpiresAt} />
            </React.Fragment>
          )
        }
      }
      return expirationMessage
    }
  }
))
