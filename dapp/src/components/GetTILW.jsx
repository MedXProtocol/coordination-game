import React, { Component } from 'react'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { get } from 'lodash'
import {
  cacheCall,
  cacheCallValueBigNumber,
  contractByName,
  withSaga
} from 'saga-genesis'
import GetTILWCoinImg from '~/assets/img/get-tilw-coin.png'
import GetTILWCoinImg2x from '~/assets/img/get-tilw-coin@2x.png'

function mapStateToProps (state) {
  const address = get(state, 'sagaGenesis.accounts[0]')

  const workTokenAddress = contractByName(state, 'WorkToken')
  const tilwBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

  const betaFaucetModalDismissed = get(state, 'betaFaucet.betaFaucetModalDismissed')

  return {
    address,
    betaFaucetModalDismissed,
    workTokenAddress,
    tilwBalance
  }
}

function* getTILWSaga({ workTokenAddress, address }) {
  if (!workTokenAddress || !address) { return }

  yield all([
    cacheCall(workTokenAddress, 'balanceOf', address)
  ])
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchShowBetaFaucetModal: () => {
      dispatch({ type: 'SHOW_BETA_FAUCET_MODAL', manuallyOpened: true })
    }
  }
}

export const GetTILW = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(getTILWSaga)(
    class _GetTILW extends Component {

      render() {
        const visible = (
          this.props.workTokenAddress &&
          (this.props.tilwBalance !== undefined) &&
          (this.props.tilwBalance < 25) &&
          this.props.betaFaucetModalDismissed
        )

        return (
          <button
            onClick={this.props.dispatchShowBetaFaucetModal}
            className={classnames(
              'button',
              'button--getTilw',
              {
                'is-hidden': !visible
              }
            )}
          >
            <img
              src={GetTILWCoinImg}
              alt="Get More TILW Token"
              width="100"
              srcSet={`${GetTILWCoinImg} 1x, ${GetTILWCoinImg2x} 2x`}
            />
          </button>
        )
      }

    }
  )
)
