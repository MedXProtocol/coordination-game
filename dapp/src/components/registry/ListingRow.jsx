import React, {
  PureComponent
} from 'react'
import PropTypes from 'prop-types'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  contractByName
} from 'saga-genesis'
import { connect } from 'react-redux'
import { TILW } from '~/components/TILW'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { EthAddress } from '~/components/EthAddress'

function mapStateToProps(state, { listingHash }) {
  const TILRegistry = contractByName(state, 'TILRegistry')
  const listing = cacheCallValue(state, TILRegistry, 'listings', listingHash)
  return {
    TILRegistry,
    listing
  }
}

function* listingRowSaga({ TILRegistry, listingHash }) {
  if (!TILRegistry) { return }
  yield cacheCall(TILRegistry, 'listings', listingHash)
}

export const ListingRow = connect(mapStateToProps)(
  withSaga(listingRowSaga)(
    class _ListingRow extends PureComponent {
      render () {

        const {
          applicationExpiry,
          owner,
          unstakedDeposit
        } = this.props.listing || {}

        return (
          <div className='list--item'>
            <span className="list--item__id">
              <EthAddress address={owner} />
            </span>

            <span className="list--item__date">
              <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={applicationExpiry} />
            </span>

            <span className='list--item__status'>
              <TILW wei={unstakedDeposit} />
            </span>

            <span className="list--item__view">
            </span>
          </div>
        )
      }
    }
  )
)

ListingRow.propTypes = {
  listingHash: PropTypes.string.isRequired,
  listing: PropTypes.object
}

ListingRow.defaultProps = {
  listing: {}
}
