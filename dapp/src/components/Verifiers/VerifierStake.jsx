import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get } from 'lodash'
import { BN } from 'bn.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import {
  cacheCall,
  cacheCallValue,
  cacheCallValueBigNumber,
  contractByName,
  withSaga,
  withSend
} from 'saga-genesis'
import { GetTILWLink } from '~/components/GetTILWLink'
import { Progress } from '~/components/Progress'
import { VerifierStakeStep1 } from '~/components/VerifierStake/VerifierStakeStep1'
import { VerifierStakeStep2 } from '~/components/VerifierStake/VerifierStakeStep2'
import { defined } from '~/utils/defined'
import { displayWeiToEther } from '~/utils/displayWeiToEther'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import * as routes from '~/../config/routes'

function mapStateToProps(state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const transactions = get(state, 'sagaGenesis.transactions')
  const workAddress = contractByName(state, 'Work')
  const workTokenAddress = contractByName(state, 'WorkToken')
  const tilwBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

  const allowance = cacheCallValueBigNumber(state, workTokenAddress, 'allowance', address, workAddress)
  const staked = cacheCallValueBigNumber(state, workAddress, 'balances', address)

  const isActive = cacheCallValue(state, workAddress, 'isActive', address)

  const requiredStake = cacheCallValueBigNumber(state, workAddress, 'requiredStake')
  const jobStake = cacheCallValueBigNumber(state, workAddress, 'jobStake')

  return {
    address,
    isActive,
    allowance,
    jobStake,
    requiredStake,
    staked,
    transactions,
    tilwBalance,
    workAddress,
    workTokenAddress
  }
}

function* verifierStakeSaga({ address, workTokenAddress, workAddress }) {
  if (!address || !workTokenAddress || !workAddress) { return }

  yield all([
    cacheCall(workTokenAddress, 'balanceOf', address),
    cacheCall(workTokenAddress, 'allowance', address, workAddress),
    cacheCall(workAddress, 'balances', address),
    cacheCall(workAddress, 'isActive', address),
    cacheCall(workAddress, 'jobStake'),
    cacheCall(workAddress, 'requiredStake')
  ])
}

export const VerifierStake = connect(mapStateToProps)(
  withSend(
    withSaga(verifierStakeSaga)(
      class _VerifierStake extends Component {

        /*
          TODO: this is actually more complicated: we need to check that they have
          less than 1000 staked, and that their TILW balance is 1000 or more
          OR that they have 1000 or more approved
        */
        canApprove = () => {
          const { tilwBalance, requiredStake } = this.props

          return defined(tilwBalance)
            && defined(requiredStake)
            && tilwBalance.gte(requiredStake)
        }

        approvalComplete = () => {
          const { allowance, requiredStake } = this.props

          return defined(allowance)
            && defined(requiredStake)
            && allowance.gte(requiredStake)
        }

        /*
          TODO: this is actually more complicated: we need to check that they have
          less than 1000 staked, and that their TILW balance is 1000 or more
          OR that they have 1000 or more approved
        */
        canStake = () => {
          const { allowance, requiredStake } = this.props

          return defined(allowance)
            && defined(requiredStake)
            && allowance.gte(requiredStake)
        }

        stakeComplete = () => {
          return !!this.props.isActive
        }

        render() {
          let needsTILWMessage
          const { requiredStake, staked, isActive } = this.props
          const hasBalance = staked && staked.gt(new BN(0))

          if (!this.canApprove() && !isActive) {
            needsTILWMessage = (
              <p>
                You need at least <strong>{displayWeiToEther(requiredStake)} TILW</strong> before you can become a verifier.
                <br /><br /><GetTILWLink />
              </p>
            )
          }

          var withdrawButton =
            <Web3ActionButton
              contractAddress={this.props.workAddress}
              method='withdrawStake'
              buttonText='Withdraw'
              loadingText='Withdrawing...'
              confirmationMessage='"Withdraw" transaction confirmed.'
              txHashMessage='"Withdraw" transaction sent successfully -
                it will take a few minutes to confirm on the Ethereum network.' />

          return (
            <div>
              {isActive
                ?
                  (
                    <React.Fragment>
                      <p>
                        <FontAwesomeIcon icon={faCheckCircle} width="100" className="has-text-primary" />&nbsp;
                        You have successfully staked <strong>{displayWeiToEther(staked)} TILW</strong> and are now a Verifier.
                      </p>
                      {hasBalance &&
                        <React.Fragment>
                          <p>
                            If you wish to withdraw your stake and cease being a verifier you may do so.
                            <br />
                          </p>
                          {withdrawButton}
                        </React.Fragment>
                      }
                      <div className="content">
                        <ul>
                          <li>
                            You will be assigned applications to verify which will
                            appear on the <Link to={routes.VERIFY}>Verify</Link> page.
                          </li>
                          <li>
                            On the <Link to={routes.WALLET}>Wallet</Link> page you
                            may withdraw your stake to give up your Verifying rights.
                          </li>
                        </ul>
                      </div>
                    </React.Fragment>
                  )
                : (
                    <React.Fragment>
                      <p>
                        Stake TEX to begin receiving submissions (minimum 1000 TEX)
                      </p>
                      {hasBalance &&
                        <React.Fragment>
                          <p>
                            You have some balance remaining: if you like you can withdraw it.
                            <br />
                          </p>
                          {withdrawButton}
                        </React.Fragment>
                      }
                      <Progress
                        disabled={needsTILWMessage}
                        labels={['Send Approval', 'Deposit Stake', 'Done!']}
                        progressState={{
                          step1Active: !this.approvalComplete() && this.canApprove(),
                          step2Active: this.approvalComplete() && this.canStake(),
                          step3Active: false,

                          step1Complete: this.canStake() || isActive,
                          step2Complete: isActive,
                          step3Complete: isActive
                        }}
                      />

                      <VerifierStakeStep1
                        {...this.props}
                        approvalComplete={this.approvalComplete}
                        canApprove={this.canApprove}
                      />
                      {needsTILWMessage}

                      <VerifierStakeStep2
                        {...this.props}
                        isActive={isActive}
                        canStake={this.canStake}
                      />
                    </React.Fragment>
                  )
              }
            </div>
          )
        }
      }
    )
  )
)
