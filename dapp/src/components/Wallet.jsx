import React, { Component } from 'react'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get } from 'lodash'
import Odometer from 'react-odometerjs'
import {
  cacheCall,
  cacheCallValueBigNumber,
  contractByName,
  withSaga
} from 'saga-genesis'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { displayWeiToEther } from '~/utils/displayWeiToEther'
import TILWLogoImg from '~/assets/img/tilw-logo-white.svg'

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

  return {
    address,
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

function* walletSaga({ address, workTokenAddress, workAddress }) {
  if (!address || !workTokenAddress || !workAddress) { return }

  yield all([
    cacheCall(workTokenAddress, 'balanceOf', address),
    cacheCall(workTokenAddress, 'allowance', address, workAddress),
    cacheCall(workAddress, 'balances', address),
    cacheCall(workAddress, 'jobStake'),
    cacheCall(workAddress, 'requiredStake')
  ])
}

export const Wallet = connect(mapStateToProps)(
  withSaga(walletSaga)(
    class _Wallet extends Component {

      render() {
        return (
          <div>
            <ScrollToTop />
            <PageTitle title='wallet' />

            <div className="level--container">
              <nav className="level level--header">
                <p className="level-item has-text-centered">
                  <span className="title">
                    <TILWLogoImg width="100" height="50" />
                  </span>
                </p>
              </nav>
              <nav className="level level--body">
                <div className="level-item has-text-centered">
                  <div>
                    <span className="heading">
                      Balance
                    </span>
                    <span className="title">
                      <Odometer value={displayWeiToEther(this.props.tilwBalance)} />
                    </span>
                  </div>
                </div>
              </nav>

              <nav className="level level--footer">
                <div className="level-item has-text-centered">
                  <div>
                    <span className="heading">
                      Approved:
                    </span>
                    <span className="title">
                      <Odometer value={displayWeiToEther(this.props.allowance)} />
                    </span>
                  </div>
                </div>
                <div className="level-item has-text-centered">
                  <div>
                    <span className="heading">
                      {this.props.staked > 0 ? 'Staked:' : 'Required Stake:'}
                    </span>
                    <span className="title">
                      {
                        this.props.staked > 0
                          ? <Odometer value={displayWeiToEther(this.props.staked)} />
                          : <Odometer value={displayWeiToEther(this.props.requiredStake)} />
                      }
                    </span>
                  </div>
                </div>
              </nav>
            </div>


          </div>
        )
      }
    }
  )
)
