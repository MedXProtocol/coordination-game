import React, {
  PureComponent
} from 'react'
import {
  withSaga,
  contractByName
} from 'saga-genesis'
import { get } from 'lodash'
import { connect } from 'react-redux'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { applicationService } from '~/services/applicationService'
import { applicationSaga } from '~/sagas/applicationSaga'
import { mapApplicationState } from '~/services/mapApplicationState'

function mapStateToProps(state, { applicationId }) {
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')

  // const applicantRevealTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'applicantRevealTimeoutInSeconds')
  // const verifierTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'verifierTimeoutInSeconds')
  //
  // const verification = mapToVerification(cacheCallValue(state, coordinationGameAddress, 'verifications', applicationId))
  // const game = mapToGame(cacheCallValue(state, coordinationGameAddress, 'games', applicationId))
  //
  // const verifierSubmittedAt = verification.verifierSubmittedAt
  // const verifierChallengedAt = verification.verifierChallengedAt
  // const verifiersSecret = verification.verifierSecret
  // const applicantsSecret = verification.applicantSecret
  //
  // const updatedAt = game.updatedAt
  // const whistleblower = game.whistleblower

  const applicationObject = applicationService(state, applicationId, coordinationGameAddress)

  return {
    address,
    applicationObject,
    coordinationGameAddress,
    latestBlockTimestamp//,
    // updatedAt,
    // applicantRevealTimeoutInSeconds,
    // verifierTimeoutInSeconds,
    // verifierSubmittedAt,
    // verifierChallengedAt,
    // verifiersSecret,
    // applicantsSecret,
    // whistleblower
  }
}

// function* applicationStatusSaga({ coordinationGameAddress, applicationId }) {
//   if (!coordinationGameAddress || !applicationId) { return }
//   yield all([
//     cacheCall(coordinationGameAddress, 'verifications', applicationId),
//     cacheCall(coordinationGameAddress, 'games', applicationId),
//     cacheCall(coordinationGameAddress, 'applicantRevealTimeoutInSeconds'),
//     cacheCall(coordinationGameAddress, 'verifierTimeoutInSeconds')
//   ])
// }

export const ApplicationStatus = connect(mapStateToProps)(
  withSaga(applicationSaga)(
    class _ApplicationStatus extends PureComponent {
      render () {
        let message

        const {
          address,
          applicationObject,
          latestBlockTimestamp,
        } = this.props

        const applicationState = mapApplicationState(address, applicationObject, latestBlockTimestamp)

        if (applicationState.needsAVerifier) {
          message = (
            <React.Fragment>
              <strong>Waiting on Applicant</strong>
            </React.Fragment>
          )
        } else if (!applicationState.noWhistleblower) {
          message = (
            <React.Fragment>
              Application Disqualified
              <br /><strong>Whistleblown!</strong>
            </React.Fragment>
          )
        } else if (applicationState.applicantRevealedSecret) {
          message = (
            <React.Fragment>
              Application Complete
              <br /><strong>{applicationState.applicantWon ? `Contract addresses matched` : `Contract addresses did not match`}</strong>
            </React.Fragment>
          )
        //!verifierSubmittedSecret && (latestBlockTimestamp > verifierSubmitSecretExpiresAt)
        } else if (applicationState.needsNewVerifier) {
          message = <strong>The verify deadline has passed</strong>
        } else if (!applicationState.verifierSubmittedSecret) {
          message = (
            <React.Fragment>
              <strong>Verification required before:</strong>
              <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={applicationObject.verifierSubmitSecretExpiresAt} />
            </React.Fragment>
          )
        } else if (applicationState.verifierSubmittedSecret) {
          if (applicationState.applicantMissedRevealDeadline) {
            if (applicationState.verifierHasChallenged) {
              message = (
                <React.Fragment>
                  <strong>The application was successfully challenged</strong>
                </React.Fragment>
              )
            } else {
              message = (
                <React.Fragment>
                  <strong>Applicant failed to reveal secret</strong>
                </React.Fragment>
              )
            }
          } else {
            message = (
              <React.Fragment>
                <strong>Waiting on applicant to reveal secret before:</strong>
                <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={applicationObject.applicantRevealExpiresAt} />
              </React.Fragment>
            )
          }
        }

        return message
      }
    }
  )
)
