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
import GetTEXCoinImg from '~/assets/img/get-tex-coin.png'
import GetTEXCoinImg2x from '~/assets/img/get-tex-coin@2x.png'

function mapStateToProps (state) {
  const address = get(state, 'sagaGenesis.accounts[0]')

  const workTokenAddress = contractByName(state, 'WorkToken')
  const texBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

  const betaFaucetModalDismissed = get(state, 'betaFaucet.betaFaucetModalDismissed')

  return {
    address,
    betaFaucetModalDismissed,
    workTokenAddress,
    texBalance
  }
}

function* getTEXSaga({ workTokenAddress, address }) {
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

export const GetTEX = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(getTEXSaga)(
    class _GetTEX extends Component {

      render() {
        const visible = (
          this.props.workTokenAddress &&
          (this.props.texBalance !== undefined) &&
          (this.props.texBalance < 25) &&
          this.props.betaFaucetModalDismissed
        )

        return (
          <button
            onClick={this.props.dispatchShowBetaFaucetModal}
            className={classnames(
              'button',
              'button--getTEX',
              {
                'is-hidden': !visible
              }
            )}
          >
            <img
              src={GetTEXCoinImg}
              alt="Get More TEX Token"
              width="100"
              srcSet={`${GetTEXCoinImg} 1x, ${GetTEXCoinImg2x} 2x`}
            />
          </button>
        )
      }

    }
  )
)
