import React, {
  PureComponent
} from 'react'
import PropTypes from 'prop-types'
import { all } from 'redux-saga/effects'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  contractByName
} from 'saga-genesis'
import { connect } from 'react-redux'
import { EthAddress } from '~/components/EthAddress'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { TILW } from '~/components/TILW'
import { getWeb3 } from '~/utils/getWeb3'
import { hexHintToTokenData } from '~/utils/hexHintToTokenData'

function mapStateToProps(state, { listingHash }) {
  const web3 = getWeb3()
  const address = state.sagaGenesis.accounts[0]
  const TILRegistry = contractByName(state, 'TILRegistry')
  const CoordinationGame = contractByName(state, 'CoordinationGame')
  const listing = cacheCallValue(state, TILRegistry, 'listings', listingHash)
  const applicationId = web3.utils.hexToNumber(listingHash)
  const hexHint = cacheCallValue(state, CoordinationGame, 'hints', applicationId)
  const hexSecret = cacheCallValue(state, CoordinationGame, 'applicantSecrets', applicationId)
  const secret = hexSecret
  // const secret = web3.utils.hexToNumber(hexSecret || '0x0')

  // Parse and convert the generic hint field to our DApp-specific data
  const [tokenTicker, tokenName] = hexHintToTokenData(hexHint)

  return {
    TILRegistry,
    CoordinationGame,
    listing,
    applicationId,
    tokenTicker,
    tokenName,
    address,
    secret
  }
}

function* listingRowSaga({ TILRegistry, CoordinationGame, listingHash, applicationId }) {
  if (!TILRegistry || !CoordinationGame || !listingHash || !applicationId) { return }
  yield all([
    cacheCall(TILRegistry, 'listings', listingHash),
    cacheCall(CoordinationGame, 'hints', applicationId),
    cacheCall(CoordinationGame, 'applicantSecrets', applicationId)
  ])
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
              <TILW wei={unstakedDeposit} />
            </span>

            <span className='list--item__status'>
              <strong>Token Ticker:</strong> {this.props.tokenTicker}
              <br />
              <strong>Token Name:</strong> {this.props.tokenName}
              <br />
              <strong>Contract Address:</strong> {this.props.secret}
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
