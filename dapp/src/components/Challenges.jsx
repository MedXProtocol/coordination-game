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
import { ListingRow } from '~/components/registry/ListingRow'
import { Pagination } from '~/components/Pagination'
import { formatRoute } from 'react-router-named-routes'
import { isBlank } from '~/utils/isBlank'
import * as routes from '~/../config/routes'

const PAGE_SIZE = 5

function mapStateToProps(state, { match }) {
  const currentPage = match.params.currentPage || 1
  const PowerChallenge = contractByName(state, 'PowerChallenge')
  const challengeCount = cacheCallValue(state, PowerChallenge, 'challengeCount')
  const startIndex = (parseInt(currentPage, 10) - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const ids = range(startIndex, endIndex).reduce((accumulator, index) => {
    const challengeId = cacheCallValue(state, PowerChallenge, 'challengeAt', index)
    if (!isBlank(challengeId)) {
      accumulator.push(challengeId)
    }
    return accumulator
  }, [])
  return {
    PowerChallenge,
    challengeCount,
    startIndex,
    endIndex,
    ids
  }
}

function* challengesSaga({ PowerChallenge, startIndex, endIndex }) {
  if (!PowerChallenge) { return }
  yield cacheCall(PowerChallenge, 'challengeCount')
  yield all(
    range(startIndex, endIndex).map(function* (index) {
      yield cacheCall(PowerChallenge, 'challengeAt', index)
    })
  )
}

export const Challenges = connect(mapStateToProps)(withSaga(challengesSaga)(
  class _Challenges extends PureComponent {
    renderApplicationRows(ids) {
      return ids.map((challengeId) => {
        return (
          <ListingRow
            listingHash={challengeId}
            key={`applications-list-application-row-${challengeId}`}
          />
        )
      })
    }

    render () {
      const totalPages = parseInt(this.props.challengeCount / PAGE_SIZE, 10)

      return (
        <div className='list--container'>
          <div className="list">
            {this.renderApplicationRows(this.props.ids)}
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
