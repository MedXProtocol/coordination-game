import React, { Component } from 'react'
import { connect } from 'react-redux'
import ReactTooltip from 'react-tooltip'
import { all } from 'redux-saga/effects'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  cacheCallValueBigNumber,
  contractByName
} from 'saga-genesis'
import BN from 'bn.js'
import { AppId } from '~/components/AppId'
import { EtherscanLink } from '~/components/EtherscanLink'
import { ChallengePanel } from '~/components/Listings/ChallengePanel'
import { ScrollToTop } from '~/components/ScrollToTop'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { mapToGame } from '~/services/mapToGame'
import { Listing as ListingModel } from '~/models/Listing'
import { Challenge } from '~/models/Challenge'
import { hexHintToTokenData } from '~/utils/hexHintToTokenData'
import { bytes32ToAddress } from '~/utils/bytes32ToAddress'

function mapStateToProps(state, { match }) {
  const listingHash = match.params.listingHash
  const address = state.sagaGenesis.accounts[0]
  const TILRegistry = contractByName(state, 'TILRegistry')
  const PowerChallenge = contractByName(state, 'PowerChallenge')
  const CoordinationGame = contractByName(state, 'CoordinationGame')
  const WorkToken = contractByName(state, 'WorkToken')
  const game = mapToGame(cacheCallValue(state, CoordinationGame, 'games', listingHash))
  const listing = new ListingModel(cacheCallValue(state, TILRegistry, 'listings', listingHash))
  const challenge = new Challenge(cacheCallValue(state, PowerChallenge, 'challenges', listingHash))
  const powerChallengeAllowance = cacheCallValueBigNumber(state, WorkToken, 'allowance', address, PowerChallenge) || new BN(0)
  const nextDepositAmount = cacheCallValueBigNumber(state, PowerChallenge, 'nextDepositAmount', listingHash) || new BN(0)

  return {
    TILRegistry,
    WorkToken,
    CoordinationGame,
    PowerChallenge,
    powerChallengeAllowance,
    nextDepositAmount,
    listingHash,
    listing,
    address,
    challenge,
    game
  }
}

function* listingSaga({ TILRegistry, CoordinationGame, PowerChallenge, WorkToken, address, listingHash }) {
  if (!TILRegistry || !CoordinationGame || !PowerChallenge || !listingHash || !address || !WorkToken) { return }
  yield all([
    cacheCall(TILRegistry, 'listings', listingHash),
    cacheCall(CoordinationGame, 'games', listingHash),
    cacheCall(PowerChallenge, 'challenges', listingHash),
    cacheCall(WorkToken, 'allowance', address, PowerChallenge),
    cacheCall(PowerChallenge, 'nextDepositAmount', listingHash)
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
          hint,
          applicantSecret
        } = game || {}
        // necessary to show the verifier on 1st-time component load
        ReactTooltip.rebuild()

        const challengeStarted = challenge.isChallenging()

        if (listing.owner === address && TILRegistry) {
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

        if (listing.isDeleted()) {
          var message =
            <p className="is-size-7 has-text-grey-lighter">
              This listing was challenged and removed.
            </p>
        } else {
          var challengeAction = <ChallengePanel listingHash={listingHash} />
        }

        const [tokenTicker, tokenName] = hexHintToTokenData(hint)
        const tokenAddress = bytes32ToAddress(applicantSecret)

        return (
          <div className='column is-8-widescreen is-offset-2-widescreen paper'>
            <ScrollToTop />

            <div className="has-text-right">
              <button
                className="is-warning is-outlined is-pulled-right delete is-large"
                onClick={this.handleCloseClick}
              >

              </button>
            </div>

            <h6 className="is-size-6 has-text-grey application-num">
              Challenge <AppId applicationId={listingHash} />
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

            <div className='columns'>
              <div className='column'>
                <h5 className="is-size-5 has-text-grey-lighter">
                  Token Address:
                </h5>
                <h3 className="is-size-3 has-text-grey-light">
                  <EtherscanLink address={tokenAddress}>{tokenAddress}</EtherscanLink>
                </h3>
              </div>
            </div>

            <br />
            {action}
            <br />
            {challengeAction}
            <br />
            {message}
          </div>
        )
      }
    }
  )
)
