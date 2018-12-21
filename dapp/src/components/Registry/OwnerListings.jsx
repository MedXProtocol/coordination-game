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

function mapStateToProps(state, { currentPage, pageSize }) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const tilRegistryAddress = contractByName(state, 'TILRegistry')
  const listingsCount = cacheCallValue(state, tilRegistryAddress, 'getOwnerListingsCount', address)

  const startIndex = (parseInt(currentPage, 10) - 1) * pageSize
  const endIndex = startIndex + pageSize
  const listingHashes = range(startIndex, endIndex).reduce((accumulator, index) => {
    const hash = cacheCallValue(state, tilRegistryAddress, 'getOwnerListingAtIndex', address, index)

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
    listingsCount,
    listingHashes
  }
}

function* ownerListingsSaga({ tilRegistryAddress, startIndex, endIndex, address }) {
  if (!address || !tilRegistryAddress) { return }

  const listingsCount = yield cacheCall(tilRegistryAddress, 'getOwnerListingsCount', address)

  yield all(range(startIndex, endIndex).map(function* (index) {
    if (index < listingsCount) {
      yield cacheCall(tilRegistryAddress, 'getOwnerListingAtIndex', address, index)
    }
  }))
}

export const OwnerListings = connect(mapStateToProps)(
  withSaga(ownerListingsSaga)(
    class _OwnerListings extends Component {

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
        const {
          listingsCount,
          currentPage,
          currentPageParamName,
          listingHashes
        } = this.props
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
                <span className="is-size-6">
                  You have no listings yet -&nbsp;
                  <Link to={routes.REGISTER_TOKEN}>
                    Register a Token Now
                  </Link>
                </span>
              </div>
            </div>
          )
        } else {
          listingRows = listingHashes.map(
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
                currentPage={parseInt(currentPage, 10)}
                totalPages={totalPages}
                linkTo={(number, location) => formatPageRouteQueryParams(
                  routes.REGISTRY,
                  currentPageParamName,
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

OwnerListings.propTypes = {
  pageSize: PropTypes.number.isRequired,
  currentPage: PropTypes.any
}

OwnerListings.defaultProps = {
  pageSize: 5,
  currentPage: 1
}
