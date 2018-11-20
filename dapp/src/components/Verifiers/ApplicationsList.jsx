import React, {
  PureComponent
} from 'react'
import { all } from 'redux-saga/effects'
import {
  withSaga,
  cacheCall,
  contractByName,
  cacheCallValue
} from 'saga-genesis'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { range } from 'lodash'
import { ApplicationRow } from '~/components/Applications/ApplicationRow'
import { Pagination } from '~/components/Pagination'
import { formatRoute } from 'react-router-named-routes'
import { isBlank } from '~/utils/isBlank'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { currentPage, pageSize }) {
  const CoordinationGame = contractByName(state, 'CoordinationGame')
  const applicationCount = cacheCallValue(state, CoordinationGame, 'applicationCount')
  const startIndex = (parseInt(currentPage, 10) - 1) * pageSize
  const endIndex = startIndex + pageSize
  const applicationIds = range(startIndex, endIndex).reduce((accumulator, index) => {
    const applicationId = cacheCallValue(state, CoordinationGame, 'applicationAt', index)
    if (!isBlank(applicationId)) {
      accumulator.push(applicationId)
    }
    return accumulator
  }, [])
  return {
    CoordinationGame,
    applicationCount,
    startIndex,
    endIndex,
    applicationIds
  }
}

function* applicationsListSaga({ CoordinationGame, startIndex, endIndex }) {
  if (!CoordinationGame) { return }
  yield cacheCall(CoordinationGame, 'applicationCount')
  yield all(
    range(startIndex, endIndex).map(function* (index) {
      yield cacheCall(CoordinationGame, 'applicationAt', index)
    })
  )
}

export const ApplicationsList = connect(mapStateToProps)(withSaga(applicationsListSaga)(
  class _ApplicationsList extends PureComponent {

    renderApplicationRows(applicationIds) {
      return applicationIds.map((applicationId) => {
        return (
          <ApplicationRow
            applicationId={applicationId}
            key={`applications-list-application-row-${applicationId}`}
          />
        )
      })
    }

    render () {
      const totalPages = parseInt(this.props.applicationCount / this.props.pageSize, 10)

      return (
        <div className='list--container'>
          <div className="list">
            {this.renderApplicationRows(this.props.applicationIds)}
          </div>

          <Pagination
            currentPage={parseInt(this.props.currentPage, 10)}
            totalPages={totalPages}
            formatPageRoute={(number) => formatRoute(routes.REGISTRY, { currentPage: number })}
            />
        </div>
      )
    }
  }
))

ApplicationsList.propTypes = {
  pageSize: PropTypes.number.isRequired,
  currentPage: PropTypes.any
}

ApplicationsList.defaultProps = {
  pageSize: 5,
  currentPage: 1
}
