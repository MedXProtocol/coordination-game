import React, {
  PureComponent
} from 'react'
import { formatRoute } from 'react-router-named-routes'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  contractByName,
  withSend
} from 'saga-genesis'
import { get } from 'lodash'
import { connect } from 'react-redux'
import { AppId } from '~/components/AppId'
import { ApplicationListPresenter } from '~/components/Applications/ApplicationListPresenter'
import { ApplicationStatus } from '~/components/Applications/ApplicationStatus'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { mapToGame } from '~/services/mapToGame'
import { isBlank } from '~/utils/isBlank'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { applicationId }) {
  const CoordinationGame = contractByName(state, 'CoordinationGame')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const game = mapToGame(cacheCallValue(state, CoordinationGame, 'games', applicationId))

  const applicant = game.applicant
  const updatedAt = game.createdAt

  return {
    CoordinationGame,
    address,
    applicant,
    updatedAt
  }
}

function* applicationRowSaga({ CoordinationGame, applicationId }) {
  if (!CoordinationGame || isBlank(applicationId)) { return }
  yield cacheCall(CoordinationGame, 'games', applicationId)
}

export const ApplicationRow = connect(mapStateToProps)(withSaga(applicationRowSaga)(withSend(
  class _ApplicationRow extends PureComponent {
    render () {
      let {
        applicationId,
        updatedAt
      } = this.props

      if (updatedAt) {
        var updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={``} />
      }

      return (
        <ApplicationListPresenter
          linkTo={formatRoute(routes.APPLICATION, { applicationId })}
          id={<AppId applicationId={applicationId} />}
          date={updatedAtDisplay}
          status={<ApplicationStatus applicationId={applicationId} />}
          view={null}
          needsAttention={false}
        />
      )
    }
  }
)))
