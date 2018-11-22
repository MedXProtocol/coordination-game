import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { all } from 'redux-saga/effects'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  cacheCallValueBigNumber,
  contractByName
} from 'saga-genesis'
import BN from 'bn.js'
import { Listing } from '~/models/Listing'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { TEX } from '~/components/TEX'
import { Challenge } from '~/models/Challenge'
import { get } from 'lodash'

function mapStateToProps(state, { listingHash }) {
  const address = state.sagaGenesis.accounts[0]
  const TILRegistry = contractByName(state, 'TILRegistry')
  const PowerChallenge = contractByName(state, 'PowerChallenge')
  const WorkToken = contractByName(state, 'WorkToken')
  const timeout = cacheCallValueBigNumber(state, PowerChallenge, 'timeout') || new BN(0)
  const challenge = new Challenge(cacheCallValue(state, PowerChallenge, 'challenges', listingHash))
  const powerChallengeAllowance = cacheCallValueBigNumber(state, WorkToken, 'allowance', address, PowerChallenge) || new BN(0)
  const registryAllowance = cacheCallValueBigNumber(state, WorkToken, 'allowance', address, TILRegistry) || new BN(0)
  const nextDepositAmount = cacheCallValueBigNumber(state, PowerChallenge, 'nextDepositAmount', listingHash) || new BN(0)
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const totalWithdrawal = cacheCallValueBigNumber(state, TILRegistry, 'totalChallengeReward', listingHash, address) || new BN(0)
  const listing = new Listing(cacheCallValue(state, TILRegistry, 'listings', listingHash))

  return {
    TILRegistry,
    WorkToken,
    PowerChallenge,
    powerChallengeAllowance,
    registryAllowance,
    nextDepositAmount,
    listingHash,
    address,
    challenge,
    listing,
    latestBlockTimestamp,
    timeout,
    totalWithdrawal
  }
}

function* challengePanelSaga({ PowerChallenge, WorkToken, TILRegistry, address, listingHash }) {
  if (!PowerChallenge || !WorkToken || !TILRegistry || !address || !listingHash) { return }
  yield all([
    cacheCall(WorkToken, 'allowance', address, PowerChallenge),
    cacheCall(WorkToken, 'allowance', address, TILRegistry),
    cacheCall(PowerChallenge, 'challenges', listingHash),
    cacheCall(PowerChallenge, 'nextDepositAmount', listingHash),
    cacheCall(PowerChallenge, 'timeout'),
    cacheCall(TILRegistry, 'totalChallengeReward', listingHash, address),
    cacheCall(TILRegistry, 'listings', listingHash)
  ])
}

export const ChallengePanel = connect(mapStateToProps)(withSaga(challengePanelSaga)(
  class _ChallengePanel extends PureComponent {
    static propTypes = {
      listingHash: PropTypes.string.isRequired
    }

    render () {
      const {
        TILRegistry,
        listingHash,
        WorkToken,
        PowerChallenge,
        powerChallengeAllowance,
        registryAllowance,
        nextDepositAmount,
        challenge,
        latestBlockTimestamp,
        timeout,
        listing,
        totalWithdrawal
      } = this.props

      const hasNextChallengeAllowance = powerChallengeAllowance.gte(nextDepositAmount)
      const challengeDeposit = listing.deposit.mul(new BN(2))
      const hasChallengeAllowance = registryAllowance.gte(challengeDeposit)

      var challengeTitle, challengeMessage, challengeAction

      if (!hasNextChallengeAllowance && WorkToken) {
        var approvePowerChallenge =
          <Web3ActionButton
            contractAddress={WorkToken}
            method='approve'
            args={[PowerChallenge, nextDepositAmount.toString()]}
            buttonText={<span>Approve <TEX wei={nextDepositAmount} /></span>}
            loadingText='Approving...'
            className="button is-small is-info is-outlined"
            confirmationMessage='You have approved the challenge tokens.'
            txHashMessage='Approval request sent -
              it will take a few minutes to confirm on the Ethereum network.'
            key='approval' />
      }

      const isTimedOut = challenge.isTimedOut(latestBlockTimestamp, timeout)
      const stateLabel = challenge.stateAsLabel()

      if (challenge.canStart()) {
        challengeTitle = "Challenge."
        if (!hasChallengeAllowance) {
          challengeMessage =
            <p>
              You may challenge the validity of this listing
              <br />
              To start a vote against this listing you must first approve the contract to spend <strong><TEX wei={challengeDeposit} /></strong>:
            </p>
          challengeAction =
            <Web3ActionButton
              contractAddress={WorkToken}
              method='approve'
              args={[TILRegistry, challengeDeposit.toString()]}
              buttonText={<span>Approve <TEX wei={challengeDeposit} /></span>}
              loadingText='Approving...'
              className="button is-small is-info is-outlined"
              confirmationMessage='You have approved the challenge tokens.'
              txHashMessage='Approval request sent -
                it will take a few minutes to confirm on the Ethereum network.'
              key='challengeApproval' />
        } else {
          challengeMessage =
            <p>
              You may challenge the validity of this listing:
            </p>
          challengeAction =
            <Web3ActionButton
              contractAddress={TILRegistry}
              method='challenge'
              args={[listingHash]}
              buttonText={<span>Challange</span>}
              loadingText='Challenging...'
              className="button is-small is-info is-outlined"
              confirmationMessage='You have challenged this listing.'
              txHashMessage='Challenge request sent -
                it will take a few minutes to confirm on the Ethereum network.'
              key='startChallenge' />
        }
      } else if (challenge.isChallenging() && isTimedOut) {
        if (totalWithdrawal.gt(new BN(0))) {
          var challengeWithdrawMessage = <span>You have been awarded <TEX wei={totalWithdrawal} />.</span>
          challengeAction =
            <Web3ActionButton
              contractAddress={TILRegistry}
              method='withdrawFromChallenge'
              args={[listingHash]}
              buttonText={<span>Withdraw <TEX wei={totalWithdrawal} /></span>}
              loadingText='Withdrawing...'
              className="button is-small is-info is-outlined"
              confirmationMessage={<span>You have withdrawn <TEX wei={totalWithdrawal} /></span>}
              txHashMessage='Withdraw request sent -
                it will take a few minutes to confirm on the Ethereum network.'
              key='withdraw' />
        }

        if (stateLabel === 'challengeFailed') {
          challengeTitle = "The challenge was unsuccessful."
          challengeMessage =
            <p>
              {challengeWithdrawMessage}
            </p>
        } else {
          challengeTitle = "This listing was successfully challenged."
          challengeMessage =
            <p>
              {challengeWithdrawMessage}
            </p>
        }
      } else if (stateLabel === 'challenged' && PowerChallenge) {
        challengeTitle = "An ongoing challenge currently favours removing this listing."

        if (!hasNextChallengeAllowance) {
          challengeMessage =
            <p>
              The listing will be removed in X days.
              <br />You can vote against this challenge. To vote in favour of this listing you must first approve the Power Challenge contract to spend <strong><TEX wei={nextDepositAmount} /></strong>:
            </p>
          challengeAction = approvePowerChallenge
        } else {
          challengeMessage =
            <p>
              To vote in favour of this listing and reject the challenge put down <strong><TEX wei={nextDepositAmount} /></strong>:
            </p>
          challengeAction =
            <Web3ActionButton
              contractAddress={PowerChallenge}
              method='approve'
              args={[this.props.listingHash]}
              buttonText='Reject Challenge'
              loadingText='Rejecting Challenge...'
              className="button is-small is-info is-outlined"
              confirmationMessage='The challenge has been rejected.'
              txHashMessage='Reject challenge request sent -
                it will take a few minutes to confirm on the Ethereum network.'
              key='rejectChallenge' />
        }
      } else if (stateLabel === 'approved' && PowerChallenge) {
        challengeTitle = "An ongoing challenge currently favours keeping this listing. You can vote against it to have it removed."

        if (!hasNextChallengeAllowance) {
          challengeMessage =
            <p>
              To challenge this listing, you must first approve the Power Challenge contract to spend <strong><TEX wei={nextDepositAmount} /></strong>
            </p>
          challengeAction = approvePowerChallenge
        } else {
          challengeMessage = <p>You can challenge the rejection using <strong><TEX wei={nextDepositAmount} /></strong>:</p>
          challengeAction =
            <Web3ActionButton
              contractAddress={PowerChallenge}
              method='challenge'
              args={[this.props.listingHash]}
              buttonText='Challenge'
              loadingText='Challenging...'
              className="button is-small is-info is-outlined"
              confirmationMessage='This listing has been challenged.'
              txHashMessage='Challenge request sent -
                it will take a few minutes to confirm on the Ethereum network.'
              key='approveChallenge' />
        }
      }

      return (
        <React.Fragment>
          <div className="columns">
            <div className="column is-8">
              <h5 className="is-size-5">
                Remove This Listing
              </h5>
              <h6 className="is-size-6">
                {challengeTitle}
              </h6>
              {challengeMessage}
              <br />

              {challengeAction}
            </div>
          </div>
        </React.Fragment>
      )
    }
  }
))
