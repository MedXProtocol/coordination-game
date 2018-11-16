import React, {
  Component
} from 'react'
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
import { mapToGame } from '~/services/mapToGame'

function mapStateToProps(state, { applicationId }) {
  const CoordinationGame = contractByName(state, 'CoordinationGame')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const game = mapToGame(cacheCallValue(state, CoordinationGame, 'games', applicationId))

  const applicant = game.applicant
  const updatedAt = game.createdAt
  const applicantSecret = game.applicantSecret
  const whistleblower = game.whistleblower
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
  if (!CoordinationGame || isBlank(applicationId)) { return }
  yield cacheCall(CoordinationGame, 'games', applicationId)
}

export const ApplicationRow = connect(mapStateToProps)(withSaga(applicationRowSaga)(withSend(
  class _ApplicationRow extends Component {
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
