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
  const nextDepositAmount = cacheCallValueBigNumber(state, PowerChallenge, 'nextDepositAmount', listingHash) || new BN(0)
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const totalWithdrawal = cacheCallValueBigNumber(state, PowerChallenge, 'totalWithdrawal', listingHash, address) || new BN(0)

  return {
    TILRegistry,
    WorkToken,
    PowerChallenge,
    powerChallengeAllowance,
    nextDepositAmount,
    listingHash,
    address,
    challenge,
    latestBlockTimestamp,
    timeout,
    totalWithdrawal
  }
}

function* challengePanelSaga({ PowerChallenge, WorkToken, address, listingHash }) {
  if (!PowerChallenge || !WorkToken || !address || !listingHash) { return }
  yield all([
    cacheCall(PowerChallenge, 'challenges', listingHash),
    cacheCall(WorkToken, 'allowance', address, PowerChallenge),
    cacheCall(PowerChallenge, 'nextDepositAmount', listingHash),
    cacheCall(PowerChallenge, 'timeout'),
    cacheCall(PowerChallenge, 'totalWithdrawal', listingHash, address)
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
        nextDepositAmount,
        challenge,
        latestBlockTimestamp,
        timeout,
        totalWithdrawal
      } = this.props

      const hasAllowance = powerChallengeAllowance.gte(nextDepositAmount)

      var challengeTitle, challengeMessage, challengeAction

      if (!hasAllowance && WorkToken) {
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

      if (isTimedOut) {
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
          challengeTitle = "The Listing Challenge was unsuccessful"
          challengeMessage =
            <p>
                {challengeWithdrawMessage}
            </p>
        } else {
          challengeTitle = "The Listing was successfully Challenged"
          challengeMessage =
            <p>
                {challengeWithdrawMessage}
            </p>
        }
      } else if (stateLabel === 'challenged' && PowerChallenge) {
        challengeTitle = "The Listing has been Challenged"
        if (!hasAllowance) {
          challengeMessage =
            <p>
              <span>To reject the challenge, you must first approve the Power Challenge contract to spend <TEX wei={nextDepositAmount} /></span>
            </p>
          challengeAction = approvePowerChallenge
        } else {
          challengeMessage =
            <p><span>You may reject the challenge with <TEX wei={nextDepositAmount} /></span></p>
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
        challengeTitle = "The Listing Challenge has been Rejected"
        if (!hasAllowance) {
          challengeMessage =
            <p>
              <span>To challenge the listing, you must first approve the Power Challenge contract to spend <TEX wei={nextDepositAmount} /></span>
            </p>
          challengeAction = approvePowerChallenge
        } else {
          challengeMessage = <p><span>You can challenge the rejection using <TEX wei={nextDepositAmount} /></span></p>
          challengeAction =
            <Web3ActionButton
              contractAddress={PowerChallenge}
              method='challenge'
              args={[this.props.listingHash]}
              buttonText='Challenge'
              loadingText='Challenging...'
              className="button is-small is-info is-outlined"
              confirmationMessage='The listing has been challenged.'
              txHashMessage='Challenge request sent -
                it will take a few minutes to confirm on the Ethereum network.'
              key='approveChallenge' />
        }
      }

      return (
        <React.Fragment>
          <h6 className="is-size-6">
            {challengeTitle}
          </h6>
          <div className="columns">
            <div className="column is-8">
              {challengeMessage}
            </div>
          </div>
          {challengeAction}
        </React.Fragment>
      )
    }
  }
))
