import React, {
  PureComponent
} from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { formatRoute } from 'react-router-named-routes'
import { LoadingLines } from '~/components/LoadingLines'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  contractByName
} from 'saga-genesis'
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

  const listingHashes = range(startIndex, endIndex).map((index) => {
    return cacheCallValue(state, TILRegistry, 'listingAt', index)
  })

  return {
    TILRegistry,
    listingsCount,
    startIndex,
    endIndex,
    listingHashes
  }
}

function* listingsSaga({ TILRegistry, startIndex, endIndex }) {
  yield cacheCall(TILRegistry, 'listingsLength')
  yield range(startIndex, endIndex).map(function* (index) {
    yield cacheCall(TILRegistry, 'listingAt', index)
  })
}

export const Listings = connect(mapStateToProps)(withSaga(listingsSaga)(class _Listings extends PureComponent {
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
    } else if (listingsCount == 0) {
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
            Listings
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
          currentPage={this.props.currentPage}
          totalPages={totalPages}
          formatPageRoute={(number) => formatRoute(routes.HOME_WITH_PAGE, { currentPage: number })}
          />
      </React.Fragment>
    )
  }
}))

Listings.propTypes = {
  pageSize: PropTypes.number.isRequired,
  currentPage: PropTypes.number
}

Listings.defaultProps = {
  pageSize: 5,
  currentPage: 1
}
