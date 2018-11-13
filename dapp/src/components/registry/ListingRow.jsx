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
import { EthAddress } from '~/components/EthAddress'
import { Web3ActionButton } from '~/components/Web3ActionButton'

function mapStateToProps(state, { listingHash }) {
  const address = state.sagaGenesis.accounts[0]
  const TILRegistry = contractByName(state, 'TILRegistry')
  const listing = cacheCallValue(state, TILRegistry, 'listings', listingHash)
  return {
    TILRegistry,
    listing,
    address
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
          TILRegistry,
          address
        } = this.props

        const {
          owner,
          unstakedDeposit,
          state
        } = this.props.listing || {}

        if (owner === address && state === '0') {
          var action =
            <Web3ActionButton
              contractAddress={TILRegistry}
              method='withdrawListing'
              args={[this.props.listingHash]}
              buttonText='Withdraw'
              loadingText='Withdrawing...'
              className="button is-small is-warning is-outlined is-pulled-right"
              confirmationMessage='Your listing has been withdrawn.'
              txHashMessage='Withdraw listing request sent -
                it will take a few minutes to confirm on the Ethereum network.' />
        }

        return (
          <div className='list--item'>
            <span className="list--item__id">
              <EthAddress address={owner} />
            </span>

            <span className="list--item__date">
            </span>

            <span className='list--item__status'>
              <TILW wei={unstakedDeposit} />
            </span>

            <span className="list--item__view">
              {action}
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
