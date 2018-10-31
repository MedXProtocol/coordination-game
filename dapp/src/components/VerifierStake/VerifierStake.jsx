import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get } from 'lodash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import {
  cacheCall,
  cacheCallValueBigNumber,
  contractByName,
  TransactionStateHandler,
  withSaga,
  withSend
} from 'saga-genesis'
import { GetTILWLink } from '~/components/GetTILWLink'
import { InfoQuestionMark } from '~/components/InfoQuestionMark'
import { LoadingLines } from '~/components/LoadingLines'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { VerifierStakeStep1 } from '~/components/VerifierStake/VerifierStakeStep1'
import { VerifierStakeStep2 } from '~/components/VerifierStake/VerifierStakeStep2'
import { defined } from '~/utils/defined'
import { displayWeiToEther } from '~/utils/displayWeiToEther'
import { etherToWei } from '~/utils/etherToWei'
import { weiToEther } from '~/utils/weiToEther'
import * as routes from '~/../config/routes'

function mapStateToProps(state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const transactions = get(state, 'sagaGenesis.transactions')
  const workAddress = contractByName(state, 'Work')
  const workTokenAddress = contractByName(state, 'WorkToken')
  const tilwBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

  const allowance = cacheCallValueBigNumber(state, workTokenAddress, 'allowance', address, workAddress)
  const staked = cacheCallValueBigNumber(state, workAddress, 'balances', address)

  const requiredStake = cacheCallValueBigNumber(state, workAddress, 'requiredStake')
  const jobStake = cacheCallValueBigNumber(state, workAddress, 'jobStake')
  const stakeLimit = cacheCallValueBigNumber(state, workAddress, 'stakeLimit')

  return {
    address,
    allowance,
    jobStake,
    requiredStake,
    staked,
    stakeLimit,
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
    cacheCall(workAddress, 'jobStake'),
    cacheCall(workAddress, 'requiredStake'),
    cacheCall(workAddress, 'stakeLimit')
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
          const { staked, requiredStake } = this.props

          return (staked && requiredStake && staked.gte(requiredStake))
        }

        render() {
          let needsTILWMessage
          const { requiredStake, staked } = this.props

          if (!this.canApprove() && !this.stakeComplete()) {
            needsTILWMessage = (
              <p>
                You need at least <strong>{displayWeiToEther(requiredStake)} TILW</strong> before you can become a verifier.
                <br /><br /><GetTILWLink />
              </p>
            )
          }

          return (
            <div>
              <ScrollToTop />
              <PageTitle title='stake' />

              <h1>
                Stake TILW to become a Verifier
              </h1>

              {needsTILWMessage}

              {this.stakeComplete()
                ?
                  (
                    <React.Fragment>
                      <p>
                        <FontAwesomeIcon icon={faCheckCircle} width="100" className="has-text-primary" />&nbsp;
                        You have successfully staked <strong>{displayWeiToEther(staked)} TILW</strong> and are now a Verifier.
                      </p>
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
                      <VerifierStakeStep1
                        {...this.props}
                        approvalComplete={this.approvalComplete}
                        canApprove={this.canApprove}
                      />

                      <VerifierStakeStep2
                        {...this.props}
                        stakeComplete={this.stakeComplete}
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
