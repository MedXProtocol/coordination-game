import ReactDOMServer from 'react-dom/server'
import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { toastr } from '~/toastr'
import ReactTooltip from 'react-tooltip'
import PropTypes from 'prop-types'
import { all } from 'redux-saga/effects'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  contractByName
} from 'saga-genesis'
import { AppId } from '~/components/AppId'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { formatRoute } from 'react-router-named-routes'
import * as routes from '~/../config/routes'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { TEX } from '~/components/TEX'
import { mapToGame } from '~/services/mapToGame'
import { mapToListing } from '~/services/mapToListing'
import { mapToChallenge } from '~/services/mapToChallenge'
import { ApplicationListPresenter } from '~/components/Applications/ApplicationListPresenter'
import { hexHintToTokenData } from '~/utils/hexHintToTokenData'
const debug = require('debug')('Listing.jsx')

function mapStateToProps(state, { match }) {
  debug(match)
  const listingHash = match.params.listingHash
  const address = state.sagaGenesis.accounts[0]
  const TILRegistry = contractByName(state, 'TILRegistry')
  const PowerChallenge = contractByName(state, 'PowerChallenge')
  const CoordinationGame = contractByName(state, 'CoordinationGame')
  const game = mapToGame(cacheCallValue(state, CoordinationGame, 'games', listingHash))
  const listing = mapToListing(cacheCallValue(state, TILRegistry, 'listings', listingHash))
  const challenge = mapToChallenge(cacheCallValue(state, PowerChallenge, 'challenges', listingHash))

  return {
    TILRegistry,
    CoordinationGame,
    PowerChallenge,
    listingHash,
    listing,
    address,
    challenge,
    game
  }
}

function* listingSaga({ TILRegistry, CoordinationGame, PowerChallenge, listingHash }) {
  if (!TILRegistry || !CoordinationGame || !listingHash) { return }
  yield all([
    cacheCall(TILRegistry, 'listings', listingHash),
    cacheCall(CoordinationGame, 'games', listingHash),
    cacheCall(PowerChallenge, 'challenges', listingHash)
  ])
}

export const Listing = connect(mapStateToProps)(
  withSaga(listingSaga)(
    class _Listing extends Component {
      constructor(props) {
        super(props)
        this.state = {}
      }

      handleCloseClick = (e) => {
        e.preventDefault()

        this.props.history.goBack()
      }

      challengeNotStarted (state) {
        return state === '0' || state === '3' || state === '4'
      }

      render () {
        const {
          listingHash,
          TILRegistry,
          game,
          address,
          listing,
          challenge
        } = this.props

        const {
          owner,
          deposit
        } = listing || {}

        const {
          state
        } = challenge || {}

        const {
          hint
        } = game || {}
        // necessary to show the verifier on 1st-time component load
        ReactTooltip.rebuild()

        const challengeStarted = !this.challengeNotStarted(state)

        if (owner === address) {
          var action =
            <Web3ActionButton
              contractAddress={TILRegistry}
              method='withdrawListing'
              args={[this.props.listingHash]}
              disabled={challengeStarted}
              buttonText='Withdraw'
              loadingText='Withdrawing...'
              className="button is-small is-info is-outlined is-pulled-right"
              confirmationMessage='Your listing has been withdrawn.'
              txHashMessage='Withdraw listing request sent -
                it will take a few minutes to confirm on the Ethereum network.' />
        }

        const [tokenTicker, tokenName] = hexHintToTokenData(hint)

        return (
          <div className='column is-8-widescreen is-offset-2-widescreen paper'>
            <div className="has-text-right">
              <button
                className="is-warning is-outlined is-pulled-right delete is-large"
                onClick={this.handleCloseClick}
              >

              </button>
            </div>

            <h6 className="is-size-6 has-text-grey application-num">
              <AppId applicationId={listingHash} />
            </h6>

            <div className="columns">
              <div className="column is-6">
                <h5 className="is-size-5 has-text-grey-lighter">
                  Token Name:
                </h5>
                <h3 className="is-size-3 has-text-grey-light">
                  {tokenName}
                </h3>
              </div>

              <div className="column is-6">
                <h5 className="is-size-5 has-text-grey-lighter">
                  Token Ticker:
                </h5>
                <h3 className="is-size-3 has-text-grey-light">
                  ${tokenTicker}
                </h3>
              </div>
            </div>

            <br />
            { action }
            <br />
            <br />

            <p className="is-size-7 has-text-grey-lighter">
              This was made sometime
            </p>
          </div>
        )
      }
    }
  )
)
