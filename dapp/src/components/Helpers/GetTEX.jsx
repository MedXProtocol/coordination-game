import React, { Component } from 'react'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { get } from 'lodash'
import { transactionFinders } from '~/finders/transactionFinders'
import {
  cacheCall,
  cacheCallValueBigNumber,
  contractByName,
  withSaga
} from 'saga-genesis'
import GetTEXCoin from '~/assets/img/get-tex-coin.svg'

function mapStateToProps (state) {
  const address = get(state, 'sagaGenesis.accounts[0]')

  const workTokenAddress = contractByName(state, 'WorkToken')
  const texBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

  const betaFaucetModalDismissed = get(state, 'betaFaucet.betaFaucetModalDismissed')

  const sendTEXTx = transactionFinders.findByMethodName(state, 'sendTEX')
  const texInFlight = sendTEXTx && !sendTEXTx.confirmed

  return {
    address,
    betaFaucetModalDismissed,
    workTokenAddress,
    texInFlight,
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
          !this.props.texInFlight &&
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
            <GetTEXCoin />
          </button>
        )
      }

    }
  )
)
