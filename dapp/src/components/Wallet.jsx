import React, { Component } from 'react'
import { connect } from 'react-redux'
import { AnimatedWrapper } from "~/components/AnimatedWrapper"
import { all } from 'redux-saga/effects'
import { get } from 'lodash'
import TILOdometer from 'react-odometerjs'
import {
  cacheCall,
  cacheCallValueBigNumber,
  contractByName,
  withSaga
} from 'saga-genesis'
import { Footer } from '~/components/Footer'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { displayWeiToEther } from '~/utils/displayWeiToEther'
import TEXCoinImg from '~/assets/img/tex-coin.png'
import TEXCoinImg2x from '~/assets/img/tex-coin.png'

function mapStateToProps(state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const transactions = get(state, 'sagaGenesis.transactions')
  const workAddress = contractByName(state, 'Work')
  const workTokenAddress = contractByName(state, 'WorkToken')
  const texBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

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
    texBalance,
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
    AnimatedWrapper(
      class _Wallet extends Component {

        render() {
          return (
            <div>
              <ScrollToTop />
              <PageTitle title='wallet' />

              <h1 className="is-size-1">
                Your Wallet
              </h1>

              <div className="level--container">
                <nav className="level level--body">
                  <div className="level-item has-text-centered">
                    <div>
                      <span className="heading">
                        <img
                          src={TEXCoinImg}
                          alt="TEX Token Icon"
                          srcSet={`${TEXCoinImg} 1x, ${TEXCoinImg2x} 2x`}
                        />
                      </span>
                      <span className="title">
                        <TILOdometer value={displayWeiToEther(this.props.texBalance)} />
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
                        <TILOdometer value={displayWeiToEther(this.props.allowance)} />
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
                            ? <TILOdometer value={displayWeiToEther(this.props.staked)} />
                            : <TILOdometer value={displayWeiToEther(this.props.requiredStake)} />
                        }
                      </span>
                    </div>
                  </div>
                </nav>
              </div>

              <Footer />
            </div>
          )
        }
      }
    )
  )
)
