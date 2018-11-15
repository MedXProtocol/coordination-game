import React, {
  Component
} from 'react'
import {
  withSaga,
  cacheCall,
  contractByName,
  cacheCallValue
} from 'saga-genesis'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { range } from 'lodash'
import { ApplicationRow } from './ApplicationRow'
import { Pagination } from '~/components/Pagination'
import { formatRoute } from 'react-router-named-routes'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { currentPage, pageSize }) {
  const CoordinationGame = contractByName(state, 'CoordinationGame')
  const applicationCount = cacheCallValue(state, CoordinationGame, 'applicationCount')
  const startIndex = (parseInt(currentPage, 10) - 1) * pageSize
  const endIndex = startIndex + pageSize
  return {
    CoordinationGame,
    applicationCount,
    startIndex,
    endIndex
  }
}

function* applicationsListSaga({ CoordinationGame }) {
  if (!CoordinationGame) { return }
  yield cacheCall(CoordinationGame, 'applicationCount')
}

export const ApplicationsList = connect(mapStateToProps)(withSaga(applicationsListSaga)(
  class _ApplicationsList extends Component {
    render () {
      const totalPages = this.props.applicationCount / this.props.pageSize

      return (
        <div className='list--container'>
          <div className="list">
            {range(this.props.startIndex, this.props.endIndex).reduce((accumulator, index) => {
              if (index < this.props.applicationCount) {
                accumulator.push(<ApplicationRow key={index} applicationId={index + 1} />)
              }
              return accumulator
            }, [])}
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
