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
import { mapToGame } from '~/services/mapToGame'
import { mapToVerification } from '~/services/mapToVerification'

function mapStateToProps(state, { applicationId }) {
  const CoordinationGame = contractByName(state, 'CoordinationGame')

  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const applicantRevealTimeoutInSeconds = cacheCallValueInt(state, CoordinationGame, 'applicantRevealTimeoutInSeconds')
  const verifierTimeoutInSeconds = cacheCallValueInt(state, CoordinationGame, 'verifierTimeoutInSeconds')

  const verification = mapToVerification(cacheCallValue(state, CoordinationGame, 'verifications', applicationId))
  const game = mapToGame(cacheCallValue(state, CoordinationGame, 'games', applicationId))

  const verifierSubmittedAt = verification.verifierSubmittedAt
  const verifierChallengedAt = verification.verifierChallengedAt
  const verifiersSecret = verification.verifierSecret
  const applicantsSecret = verification.applicantSecret

  const updatedAt = game.updatedAt
  const whistleblower = game.whistleblower

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
    cacheCall(CoordinationGame, 'verifications', applicationId),
    cacheCall(CoordinationGame, 'games', applicationId),
    cacheCall(CoordinationGame, 'applicantRevealTimeoutInSeconds'),
    cacheCall(CoordinationGame, 'verifierTimeoutInSeconds')
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
      const verifierSubmitSecretExpiresAt = parseInt(updatedAt, 10) + verifierTimeoutInSeconds

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
