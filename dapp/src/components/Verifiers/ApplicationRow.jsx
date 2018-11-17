import React, {
  PureComponent
} from 'react'
import { formatRoute } from 'react-router-named-routes'
import { all } from 'redux-saga/effects'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  contractByName,
  withSend
} from 'saga-genesis'
import { get } from 'lodash'
import { connect } from 'react-redux'
import { ApplicationListPresenter } from '~/components/Applications/ApplicationListPresenter'
import { ApplicationStatus } from '~/components/Applications/ApplicationStatus'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { applicationId }) {
  const CoordinationGame = contractByName(state, 'CoordinationGame')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const applicant = cacheCallValue(state, CoordinationGame, 'applicants', applicationId)
  const updatedAt = cacheCallValue(state, CoordinationGame, 'updatedAt', applicationId)

  return {
    CoordinationGame,
    address,
    applicant,
    updatedAt
  }
}

function* applicationRowSaga({ CoordinationGame, applicationId }) {
  if (!CoordinationGame || !applicationId) { return }
  yield all([
    cacheCall(CoordinationGame, 'applicants', applicationId),
    cacheCall(CoordinationGame, 'updatedAt', applicationId)
  ])
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
          id={null}
          date={updatedAtDisplay}
          status={<ApplicationStatus applicationId={applicationId} />}
          view={null}
          needsAttention={false}
        />
      )
    }
  }
)))
