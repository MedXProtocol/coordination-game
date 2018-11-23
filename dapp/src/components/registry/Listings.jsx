import React, {
  Component
} from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  contractByName
} from 'saga-genesis'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
import { range } from 'lodash'
import { LoadingLines } from '~/components/LoadingLines'
import { Pagination } from '~/components/Pagination'
import { ListingRow } from './ListingRow'
import { formatPageRouteQueryParams } from '~/services/formatPageRouteQueryParams'
import * as routes from '~/../config/routes'

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

  constructor(props) {
    super(props)
    this.state = {}
  }

  handleTextInputChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  handleSubmitSearch = (e) => {
    this.props.history.push(this.state.searchQuery)
  }

  render () {
    let loadingLines,
      noListings,
      listingRows

    const totalPages = Math.ceil(this.props.listingsCount / this.props.pageSize)
    const { listingsCount } = this.props
    const loading = listingsCount === undefined

    if (loading) {
      loadingLines = (
        <div className="blank-state">
          <div className="blank-state--inner has-text-grey-lighter">
            <LoadingLines visible={true} />
          </div>
        </div>
      )
    } else if (parseInt(listingsCount, 10) === 0) {
      noListings = (
        <div className="blank-state">
          <div className="blank-state--inner has-text-grey-lighter">
            <span className="is-size-6">There are no listings.</span>
          </div>
        </div>
      )
    } else {
      listingRows = this.props.listingHashes.map(
        (listingHash) => <ListingRow listingHash={listingHash} key={listingHash} />
      )
    }

    return (
      <React.Fragment>
        <div className="is-clearfix">
          <div className="columns">
            <div className="column is-6">
              <h6 className="is-size-10 list--title">
                Registry Listings
              </h6>
            </div>

            <div className="column is-6 list--action-container">
              <Link to={routes.REGISTER_TOKEN} className="button is-outlined is-primary is-small list--action">
                Register a Token
              </Link>
            </div>
          </div>
        </div>

        <div className='list--container list--registry-list'>
          {loadingLines}
          {noListings}

          <div className="list">
            {listingRows}
          </div>
          <Pagination
            currentPage={parseInt(this.props.currentPage, 10)}
            totalPages={totalPages}
            linkTo={(number, location) => formatPageRouteQueryParams(
              routes.REGISTRY,
              'listingsCurrentPage',
              number,
              location
            )}
          />
        </div>
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
