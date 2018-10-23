import React, { Component } from 'react'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { cacheCall, withSaga, cacheCallValue, contractByName } from 'saga-genesis'
import GetTILWCoinImg from '~/assets/img/get-tilw-coin.png'
import GetTILWCoinImg2x from '~/assets/img/get-tilw-coin@2x.png'

function mapStateToProps (state) {
  const address = get(state, 'sagaGenesis.accounts[0]')

  const workTokenAddress = contractByName(state, 'WorkToken')
  const tilwBalance = cacheCallValue(state, workTokenAddress, 'balanceOf', address)

  return {
    address,
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

export const GetTILW = withSaga(getTILWSaga)(
  connect(mapStateToProps, mapDispatchToProps)(
    class _GetTILW extends Component {

      render() {
        let getTilw

        if (
          this.props.workTokenAddress &&
          this.props.tilwBalance !== undefined &&
          this.props.tilwBalance < 25
        ) {
          getTilw = <button
            onClick={this.props.dispatchShowBetaFaucetModal}
            className="button button--getTilw"
          >
            <img
              src={GetTILWCoinImg}
              alt="Get More TILW Token"
              width="100"
              srcSet={`${GetTILWCoinImg} 1x, ${GetTILWCoinImg2x} 2x`}
            />
          </button>
        } else {
          getTilw = null
        }

        return getTilw
      }

    }
  )
)
