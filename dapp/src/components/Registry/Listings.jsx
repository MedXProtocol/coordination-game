import React, {
  Component
} from 'react'
import PropTypes from 'prop-types'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  contractByName
} from 'saga-genesis'
import { Link } from 'react-router-dom'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
import { get, range } from 'lodash'
import { LoadingLines } from '~/components/Helpers/LoadingLines'
import { Pagination } from '~/components/Helpers/Pagination'
import { ListingRow } from './ListingRow'
import { formatPageRouteQueryParams } from '~/services/formatPageRouteQueryParams'
import { isBlank } from '~/utils/isBlank'
import * as routes from '~/../config/routes'

const getListingsCount = (state, tilRegistryAddress, address, forOwner) => {
  let count

  if (forOwner) {
    count = cacheCallValue(state, tilRegistryAddress, 'getOwnerListingsCount', address)
  } else {
    count = cacheCallValue(state, tilRegistryAddress, 'listingsLength')
  }

  return count
}

function mapStateToProps(state, { currentPage, pageSize, pageParamName }) {
  let hash

  const address = get(state, 'sagaGenesis.accounts[0]')
  const forOwner = (pageParamName === 'ownerListingsCurrentPage')
  const tilRegistryAddress = contractByName(state, 'TILRegistry')
  const listingsCount = getListingsCount(state, tilRegistryAddress, address, forOwner)

  const startIndex = (parseInt(currentPage, 10) - 1) * pageSize
  const endIndex = startIndex + pageSize
  const listingHashes = range(startIndex, endIndex).reduce((accumulator, index) => {
    if (pageParamName === 'ownerListingsCurrentPage') {
      hash = cacheCallValue(state, tilRegistryAddress, 'getOwnerListingAtIndex', address, index)
    } else {
      hash = cacheCallValue(state, tilRegistryAddress, 'listingAt', index)
    }

    if (!isBlank(hash)) {
      accumulator.push(hash)
    }
    return accumulator
  }, [])

  return {
    address,
    tilRegistryAddress,
    startIndex,
    endIndex,
    forOwner,
    listingsCount,
    listingHashes,
    pageParamName
  }
}

function* listingsSaga({ tilRegistryAddress, startIndex, endIndex, forOwner, address }) {
  let listingsCount

  if (!tilRegistryAddress) { return }

  if (forOwner) {
    listingsCount = yield cacheCall(tilRegistryAddress, 'getOwnerListingsCount', address)
  } else {
    listingsCount = yield cacheCall(tilRegistryAddress, 'listingsLength')
  }

  yield all(range(startIndex, endIndex).map(function* (index) {
    if (index < listingsCount) {
      if (forOwner) {
        yield cacheCall(tilRegistryAddress, 'getOwnerListingAtIndex', address, index)
      } else {
        yield cacheCall(tilRegistryAddress, 'listingAt', index)
      }
    }
  }))
}

export const Listings = connect(mapStateToProps)(
  withSaga(listingsSaga)(
    class _Listings extends Component {

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
        const { listingsCount, forOwner } = this.props
        const loading = listingsCount === undefined

        const blankStateText = forOwner ? 'You have no listings yet' : 'There are no listings'

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
                <span className="is-size-6">
                  {blankStateText} -&nbsp;
                  <Link to={routes.REGISTER_TOKEN}>
                    Register a Token Now
                  </Link>
                </span>
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
                  this.props.pageParamName,
                  number,
                  location
                )}
              />
            </div>
          </React.Fragment>
        )
      }
    }
  )
)

Listings.propTypes = {
  pageSize: PropTypes.number.isRequired,
  currentPage: PropTypes.any
}

Listings.defaultProps = {
  pageSize: 5,
  currentPage: 1
}
