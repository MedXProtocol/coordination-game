import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'
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
import { ApproveProgress } from '~/components/Listings/ApproveProgress'
import { ChallengeProgress } from '~/components/Listings/ChallengeProgress'
import { ChallengeTimeoutProgress } from '~/components/Listings/ChallengeTimeoutProgress'
import { ContributionProgress } from '~/components/Listings/ContributionProgress'
import { stateAsLabel } from '~/models/stateAsLabel'
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
  const totalWithdrawal = cacheCallValueBigNumber(state, PowerChallenge, 'totalWithdrawal', listingHash, address) || new BN(0)
  const listing = new Listing(cacheCallValue(state, TILRegistry, 'listings', listingHash))
  const challengeDeposit = cacheCallValueBigNumber(state, PowerChallenge, 'challengeBalance', listingHash, address)
  const approveDeposit = cacheCallValueBigNumber(state, PowerChallenge, 'approveBalance', listingHash, address)
  const winningState = cacheCallValue(state, PowerChallenge, 'winningState', listingHash)
  const isComplete = cacheCallValue(state, PowerChallenge, 'isComplete', listingHash)

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
    totalWithdrawal,
    challengeDeposit,
    approveDeposit,
    winningState,
    isComplete
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
    cacheCall(PowerChallenge, 'totalWithdrawal', listingHash, address),
    cacheCall(TILRegistry, 'listings', listingHash),
    cacheCall(PowerChallenge, 'challengeBalance', listingHash, address),
    cacheCall(PowerChallenge, 'approveBalance', listingHash, address),
    cacheCall(PowerChallenge, 'winningState', listingHash),
    cacheCall(PowerChallenge, 'isComplete', listingHash),
    cacheCall(TILRegistry, 'totalChallengeReward', listingHash, address)
  ])
}

export const ChallengePanel = connect(mapStateToProps)(withSaga(challengePanelSaga)(
  class _ChallengePanel extends PureComponent {
    static propTypes = {
      listingHash: PropTypes.string.isRequired
    }
    //
    // constructor (props) {
    //   super(props)
    //   this.state = {
    //     showActionButton: true
    //   }
    // }

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
        totalWithdrawal,
        challengeDeposit,
        approveDeposit,
        winningState,
        isComplete
      } = this.props

      const winningStateLabel = stateAsLabel(winningState)
      const hasNextChallengeAllowance = powerChallengeAllowance.gte(nextDepositAmount)
      const startChallengeDeposit = listing.deposit.mul(new BN(2))
      const hasChallengeAllowance = registryAllowance.gte(startChallengeDeposit)

      var challengeTitle, challengeBody, challengeAction

      const isTimedOut = challenge.isTimedOut(latestBlockTimestamp, timeout)
      const inProgress = challenge.isChallenging() && !isTimedOut
      const hasApproveDeposit = approveDeposit && approveDeposit.gt(new BN(0))
      const hasChallengeDeposit = challengeDeposit && challengeDeposit.gt(new BN(0))

      if (!challenge.isBlank() && isTimedOut) {
        if (winningStateLabel === 'challengeFailed') {
          challengeTitle = "The challenge was unsuccessful."
        } else {
          challengeTitle = "This listing was successfully challenged."
        }

        if (totalWithdrawal.gt(new BN(0))) {
          challengeBody =
            <div>
              <div className='columns'>
                <p className='column'>
                  <span>You have been awarded <TEX wei={totalWithdrawal} />.</span>
                </p>
              </div>
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
            </div>
        }
     } else if (inProgress) {
        var challengeTitle = 'Listing Challenged'
        var challengeProgress = <ChallengeProgress challenge={challenge} />
        var timeoutProgress =
          <ChallengeTimeoutProgress
            challenge={challenge}
            timeout={timeout || new BN(0)}
            latestBlockTimestamp={latestBlockTimestamp || new BN(0)} />

        if (hasApproveDeposit) {
          var approveDepositProgress =
            <p className='has-text-weight-bold'>
              You have rejected the challenge with <TEX wei={approveDeposit} />
            </p>
        }
        if (hasChallengeDeposit) {
          var challengeDepositProgress =
            <p className='has-text-weight-bold'>
              You have challenged the listing with <TEX wei={challengeDeposit} />
            </p>
        }

        const stateLabel = challenge.stateAsLabel()
        var rejectButtonDisabled = stateLabel !== 'challenged' || !hasNextChallengeAllowance
        var challengeButtonDisabled = stateLabel !== 'approved' || !hasNextChallengeAllowance

        if (stateLabel == 'challenged' && !hasChallengeDeposit) {
          var allowanceClassName = 'is-success'
          var actionButton =
            <Web3ActionButton
              contractAddress={PowerChallenge}
              method='approve'
              args={[this.props.listingHash]}
              disabled={rejectButtonDisabled}
              buttonText={<span>Reject Challenge <TEX wei={nextDepositAmount} /></span>}
              loadingText='Rejecting Challenge...'
              className="button is-small is-success is-outlined"
              confirmationMessage='The challenge has been rejected.'
              txHashMessage='Reject challenge request sent -
                it will take a few minutes to confirm on the Ethereum network.'
              key='rejectChallenge' />
        } else if (stateLabel == 'approved' && !hasApproveDeposit) {
          allowanceClassName = 'is-danger'
          actionButton =
            <Web3ActionButton
              contractAddress={PowerChallenge}
              method='challenge'
              args={[this.props.listingHash]}
              disabled={challengeButtonDisabled}
              buttonText={<span>Challenge <TEX wei={nextDepositAmount} /></span>}
              loadingText='Challenging...'
              className="button is-small is-danger is-outlined"
              confirmationMessage='This listing has been challenged.'
              txHashMessage='Challenge request sent - it will take a few minutes to confirm on the Ethereum network.'
              key='approveChallenge' />
        }

        if (!hasNextChallengeAllowance && WorkToken && actionButton) {
          var approvePowerChallenge =
            <Web3ActionButton
              contractAddress={WorkToken}
              method='approve'
              args={[PowerChallenge, nextDepositAmount.toString()]}
              buttonText={<span>Approve Spend of <TEX wei={nextDepositAmount} /></span>}
              loadingText='Approving...'
              className={classnames("button is-small is-outlined", allowanceClassName)}
              confirmationMessage='You have approved the challenge tokens.'
              txHashMessage='Approval request sent -
                it will take a few minutes to confirm on the Ethereum network.'
              key='approval' />
        }

        challengeBody =
          <div>
            <div className='columns'>
              <div className='column'>
                {challengeDepositProgress}
                {approveDepositProgress}
              </div>
            </div>
            {actionButton &&
              <div>
                <div className='is-inline-block'>
                  {actionButton}
                </div>
                &nbsp;
                <div className='is-inline-block'>
                  {approvePowerChallenge}
                </div>
              </div>
            }
            {challengeProgress}
            {timeoutProgress}
          </div>

      } else if (challenge.isBlank() || isComplete) {
        challengeTitle = "Challenge Listing"

        if (!hasChallengeAllowance) {
          var approveSpendButton =
            <Web3ActionButton
              contractAddress={WorkToken}
              method='approve'
              args={[TILRegistry, startChallengeDeposit.toString()]}
              buttonText={<span>Approve Spend of <TEX wei={startChallengeDeposit} /></span>}
              loadingText='Approving...'
              className="button is-small is-danger is-outlined"
              confirmationMessage='You have approved the challenge tokens.'
              txHashMessage='Approval request sent -
                it will take a few minutes to confirm on the Ethereum network.'
              key='challengeApproval' />

        }

        challengeBody =
          <div>
            <div className='columns'>
              <p className='column'>
                If the challenge is successful the listing will be removed.
              </p>
            </div>
            <div>
              <div className='is-inline-block'>
                <Web3ActionButton
                  contractAddress={TILRegistry}
                  method='challenge'
                  args={[listingHash]}
                  buttonText={<span>Challange <TEX wei={startChallengeDeposit} /></span>}
                  disabled={!hasChallengeAllowance}
                  loadingText='Challenging...'
                  className="button is-small is-danger is-outlined"
                  confirmationMessage='You have challenged this listing.'
                  txHashMessage='Challenge request sent -
                    it will take a few minutes to confirm on the Ethereum network.'
                  key='startChallenge' />
              </div>
              &nbsp;
              <div className='is-inline-block'>
                {approveSpendButton}
              </div>
            </div>
          </div>

      }

      return (
        <React.Fragment>
          <div className="columns">
            <div className="column is-8">
              <h4 className="is-size-3">
                {challengeTitle}
              </h4>
              {challengeBody}
            </div>
          </div>
        </React.Fragment>
      )
    }
  }
))
