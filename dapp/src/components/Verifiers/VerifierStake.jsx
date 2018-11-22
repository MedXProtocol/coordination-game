import React, { PureComponent } from 'react'
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
import { GetTEXLink } from '~/components/GetTEXLink'
import { Progress } from '~/components/Progress'
import { VerifierStakeStep1 } from '~/components/VerifierStake/VerifierStakeStep1'
import { VerifierStakeStep2 } from '~/components/VerifierStake/VerifierStakeStep2'
import { defined } from '~/utils/defined'
import { displayWeiToEther } from '~/utils/displayWeiToEther'
import { VerifierStakeWithdraw } from '~/components/VerifierStake/VerifierStakeWithdraw'
import * as routes from '~/../config/routes'

function mapStateToProps(state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const transactions = get(state, 'sagaGenesis.transactions')
  const workAddress = contractByName(state, 'Work')
  const workTokenAddress = contractByName(state, 'WorkToken')
  const texBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

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
    texBalance,
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
      class _VerifierStake extends PureComponent {

        /*
          TODO: this is actually more complicated: we need to check that they have
          less than 1000 staked, and that their TEX balance is 1000 or more
          OR that they have 1000 or more approved
        */
        canApprove = () => {
          const { texBalance, requiredStake } = this.props

          return defined(texBalance)
            && defined(requiredStake)
            && texBalance.gte(requiredStake)
        }

        approvalComplete = () => {
          const { allowance, requiredStake } = this.props

          return defined(allowance)
            && defined(requiredStake)
            && allowance.gte(requiredStake)
        }

        /*
          TODO: this is actually more complicated: we need to check that they have
          less than 1000 staked, and that their TEX balance is 1000 or more
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
          let needsTEXMessage
          const { requiredStake, staked, isActive } = this.props
          const hasBalance = staked && staked.gt(new BN(0))

          if (!this.canApprove() && !isActive) {
            needsTEXMessage = (
              <p>
                You need at least <strong>{displayWeiToEther(requiredStake)} TEX</strong> before you can become a verifier.
                <br /><br /><GetTEXLink />
              </p>
            )
          }

          // Prevent blips/flashing UI while loading data
          if (!defined(isActive)) {
            return null
          }

          return (
            <div>
              {isActive
                ?
                  (
                    <React.Fragment>
                      <div className='columns'>
                        <div className='column'>
                          <p>
                            <FontAwesomeIcon icon={faCheckCircle} width="100" className="has-text-primary" />&nbsp;
                            Successfully staked <strong>{displayWeiToEther(staked)} TEX</strong> and are now a Verifier.
                          </p>
                          <div className="content">
                            <ul>
                              <li>
                                You will be assigned applications to verify which will
                                appear on the <Link to={routes.VERIFY}>Verify</Link> page.
                              </li>
                              <li>
                                You may also withdraw your stake and give up your Verifying privileges.
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      {hasBalance &&
                        <VerifierStakeWithdraw
                          workContractAddress={this.props.workAddress}
                          message="If you wish to withdraw your stake and cease being a verifier you may do so." />
                      }
                    </React.Fragment>
                  )
                : (
                    <React.Fragment>
                      <p>
                        Stake TEX to begin receiving submissions (minimum 1000 TEX)
                      </p>
                      <Progress
                        disabled={needsTEXMessage}
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
                      {needsTEXMessage}

                      <VerifierStakeStep2
                        {...this.props}
                        isActive={isActive}
                        canStake={this.canStake}
                      />

                      {hasBalance &&
                        <VerifierStakeWithdraw
                          workContractAddress={this.props.workAddress}
                          message="You have some balance remaining: if you like you can withdraw it." />
                      }
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
