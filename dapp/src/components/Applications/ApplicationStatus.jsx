import React, {
  PureComponent
} from 'react'
import {
  withSaga,
  contractByName
} from 'saga-genesis'
import { get } from 'lodash'
import { connect } from 'react-redux'
import { RecordTimestampDisplay } from '~/components/Helpers/RecordTimestampDisplay'
import { applicationService } from '~/services/applicationService'
import { applicationSaga } from '~/sagas/applicationSaga'
import { mapApplicationState } from '~/services/mapApplicationState'

function mapStateToProps(state, { applicationId }) {
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')

  const applicationObject = applicationService(state, applicationId, coordinationGameAddress)

  return {
    address,
    applicationObject,
    coordinationGameAddress,
    latestBlockTimestamp
  }
}

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
        } else if (!applicationState.verifierSubmittedSecret) {
          message = (
            <React.Fragment>
              <strong>Verification required before:</strong>
              <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={applicationObject.verifierSubmitSecretExpiresAt} />
            </React.Fragment>
          )
        } else if (applicationState.verifierSubmittedSecret) {

          message = (
            <React.Fragment>
              <strong>Waiting on applicant to reveal secret before:</strong>
              <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={applicationObject.applicantRevealExpiresAt} />
            </React.Fragment>
          )

          if (applicationState.applicantMissedRevealDeadline) {
            message = <strong>Applicant failed to reveal secret</strong>

            if (applicationState.canChallenge) {
              message = <strong>Applicant waited too long, you can close this application and collect your payment</strong>
            } else if (applicationState.verifierHasChallenged) {
              message = <strong>The application was closed</strong>
            }
          }
        }

        return message
      }
    }
  )
)
