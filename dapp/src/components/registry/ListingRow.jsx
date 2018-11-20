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
// import { EthAddress } from '~/components/EthAddress'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { TEX } from '~/components/TEX'
import { hexHintToTokenData } from '~/utils/hexHintToTokenData'
import { mapToGame } from '~/services/mapToGame'

function mapStateToProps(state, { listingHash }) {
  const address = state.sagaGenesis.accounts[0]
  const TILRegistry = contractByName(state, 'TILRegistry')
  const CoordinationGame = contractByName(state, 'CoordinationGame')
  const listing = cacheCallValue(state, TILRegistry, 'listings', listingHash)
  const game = mapToGame(cacheCallValue(state, CoordinationGame, 'games', listingHash))
  const hexHint = game.hint
  const hexSecret = game.applicantSecret
  const secret = hexSecret

  // Parse and convert the generic hint field to our DApp-specific data
  const [tokenTicker, tokenName] = hexHintToTokenData(hexHint)

  return {
    TILRegistry,
    CoordinationGame,
    listing,
    tokenTicker,
    tokenName,
    address,
    secret
  }
}

function* listingRowSaga({ TILRegistry, CoordinationGame, listingHash }) {
  if (!TILRegistry || !CoordinationGame || !listingHash) { return }
  yield all([
    cacheCall(TILRegistry, 'listings', listingHash),
    cacheCall(CoordinationGame, 'games', listingHash)
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
              <TEX wei={unstakedDeposit} />
            </span>

            <span className="list--item__date">
              {/*<EthAddress address={owner} />*/}
              <strong>Token Ticker:</strong> {this.props.tokenTicker}
              <br />
              <strong>Token Name:</strong> {this.props.tokenName}
              <br />
            </span>

            <span className='list--item__status'>
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
