import React from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import classnames from 'classnames'
import {
  contractByName,
  cacheCallValueBigNumber,
  cacheCall,
  withSaga
} from 'saga-genesis'
import { EthAddress } from '~/components/EthAddress'
import { TILOdometer } from '~/components/TILOdometer'
import { networkIdToName } from '~/utils/networkIdToName'
import { displayWeiToEther } from '~/utils/displayWeiToEther'

function mapStateToProps(state, ownProps) {
  const networkId = get(state, 'sagaGenesis.network.networkId')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const networkName = networkIdToName(networkId)
  const workTokenAddress = contractByName(state, 'WorkToken')

  const ethBalance = get(state, 'sagaGenesis.ethBalance.balance')
  const texBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

  return {
    address,
    ethBalance,
    networkId,
    networkName,
    texBalance,
    workTokenAddress
  }
}

function* networkInfoSaga ({ address, workTokenAddress }) {
  if (!address || !workTokenAddress) { return }

  yield cacheCall(workTokenAddress, 'balanceOf', address)
}

export const NetworkInfo = withSaga(networkInfoSaga)(
  connect(mapStateToProps)(
    function({ address, ethBalance, networkName, texBalance }) {
      return (
        <React.Fragment>
          <div className="navbar-item has-text-transparent-white">
            <span>
              <span className={classnames(`nav--circle`, `color-${networkName.toLowerCase()}` )} />
              &nbsp;
              {networkName}
            </span>
          </div>
          <div className="navbar-item">
            <span className="navbar-item has-text-transparent-white">
              <TILOdometer delay={3000} value={displayWeiToEther(texBalance)} />&nbsp;TEX
            </span>
          </div>
          <div className="navbar-item">
            <span className="navbar-item has-text-transparent-white">
              <TILOdometer delay={4500} value={displayWeiToEther(ethBalance)} />&nbsp;Ξ
            </span>
          </div>
          <div className="navbar-item">
            <span className="navbar-item has-text-transparent-white">
              <EthAddress address={address} disallowFull={true} />
            </span>
          </div>
        </React.Fragment>
      )
    }
  )
)
