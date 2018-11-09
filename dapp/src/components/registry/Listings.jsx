import React, {
  Component
} from 'react'
import PropTypes from 'prop-types'
import { formatRoute } from 'react-router-named-routes'
import { LoadingLines } from '~/components/LoadingLines'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  contractByName
} from 'saga-genesis'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
import * as routes from '~/../config/routes'
import { Pagination } from '~/components/Pagination'
import { ListingRow } from './ListingRow'
import { range } from 'lodash'

function mapStateToProps(state, { currentPage, pageSize }) {
  const TILRegistry = contractByName(state, 'TILRegistry')
  const listingsCount = cacheCallValue(state, TILRegistry, 'listingsLength')
  const startIndex = (parseInt(currentPage, 10) - 1) * pageSize
  const endIndex = startIndex + pageSize
  const listingHashes = range(startIndex, endIndex).reduce((accumulator, index) => {
    const hash = cacheCallValue(state, TILRegistry, 'listingAt', index)
    if (hash) {
      accumulator.push(hash)
    }
    return accumulator
  }, [])

  return {
    TILRegistry,
    listingsCount,
    startIndex,
    endIndex,
    listingsCount,
    listingHashes
  }
}

function* listingsSaga({ TILRegistry, startIndex, endIndex }) {
  if (!TILRegistry) { return }
  const listingsCount = yield cacheCall(TILRegistry, 'listingsLength')
  yield all(range(startIndex, endIndex).map(function* (index) {
    if (index < listingsCount) {
      yield cacheCall(TILRegistry, 'listingAt', index)
    }
  }))
}

export const Listings = connect(mapStateToProps)(withSaga(listingsSaga)(class _Listings extends Component {
  render () {
    const totalPages = this.props.listingsCount / this.props.pageSize
    const { listingsCount } = this.props
    const loading = listingsCount === undefined

    if (loading) {
      var loadingLines = (
        <div className="blank-state">
          <div className="blank-state--inner has-text-grey-lighter">
            <LoadingLines visible={true} />
          </div>
        </div>
      )
    } else if (parseInt(listingsCount, 10) === 0) {
      var noListings = (
        <div className="blank-state">
          <div className="blank-state--inner has-text-grey-lighter">
            <span className="is-size-6">There are no listings.</span>
          </div>
        </div>
      )
    } else {
      var listingRows = this.props.listingHashes.map(
        (listingHash) => <ListingRow listingHash={listingHash} key={listingHash} />
      )
    }

    return (
      <React.Fragment>
        <div className="is-clearfix">
          <h6 className="is-size-6">
            List
          </h6>
        </div>

        <div className='list--container'>
          {loadingLines}
          {noListings}

          <div className="list">
            {listingRows}
          </div>
        </div>

        <Pagination
          currentPage={parseInt(this.props.currentPage, 10)}
          totalPages={totalPages}
          formatPageRoute={(number) => formatRoute(routes.HOME_WITH_PAGE, { currentPage: number })}
          />
      </React.Fragment>
    )
  }
}))

Listings.propTypes = {
  pageSize: PropTypes.number.isRequired,
  currentPage: PropTypes.any
}

Listings.defaultProps = {
  pageSize: 5,
  currentPage: 1
}
