import React, {
  PureComponent
} from 'react'
import { all } from 'redux-saga/effects'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  contractByName,
  withSend
} from 'saga-genesis'
import { connect } from 'react-redux'
import { isBlank } from '~/utils/isBlank'
import { ApplicationStatus } from './ApplicationStatus'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { WhistleblowButton } from './WhistleblowButton'
import { get } from 'lodash'

function mapStateToProps(state, { applicationId }) {
  const CoordinationGame = contractByName(state, 'CoordinationGame')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const applicant = cacheCallValue(state, CoordinationGame, 'applicants', applicationId)
  const updatedAt = cacheCallValue(state, CoordinationGame, 'updatedAt', applicationId)
  const applicantSecret = cacheCallValue(state, CoordinationGame, 'applicantSecrets', applicationId)
  const whistleblower = cacheCallValue(state, CoordinationGame, 'whistleblowers', applicationId)
  return {
    CoordinationGame,
    address,
    applicant,
    updatedAt,
    applicantSecret,
    whistleblower
  }
}

function* applicationRowSaga({ CoordinationGame, applicationId }) {
  if (!CoordinationGame || !applicationId) { return }
  yield all([
    cacheCall(CoordinationGame, 'applicants', applicationId),
    cacheCall(CoordinationGame, 'updatedAt', applicationId),
    cacheCall(CoordinationGame, 'applicantSecrets', applicationId),
    cacheCall(CoordinationGame, 'whistleblowers', applicationId)
  ])
}

export const ApplicationRow = connect(mapStateToProps)(withSaga(applicationRowSaga)(withSend(
  class _ApplicationRow extends PureComponent {
    render () {
      let {
        applicationId,
        updatedAt,
        applicantSecret,
        whistleblower
      } = this.props

      const secretNotRevealed = isBlank(applicantSecret)
      const noWhistleblower = isBlank(whistleblower)
      const canWhistleblow = secretNotRevealed && noWhistleblower
      if (canWhistleblow) {
        var action =
          <WhistleblowButton applicationId={applicationId} />
      }

      if (updatedAt) {
        var updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={``} />
      }

      return (
        <div className='list--item'>
          <span className="list--item__id">
            #{applicationId}
          </span>

          <span className="list--item__date">
            {updatedAtDisplay}
          </span>

          <span className='list--item__status'>
            <ApplicationStatus applicationId={applicationId} />
          </span>

          <span className="list--item__view">
            {action}
          </span>
        </div>
      )
    }
  }
)))
