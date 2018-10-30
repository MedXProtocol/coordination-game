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
import { EtherFlip } from '~/components/EtherFlip'
import { EthAddress } from '~/components/EthAddress'
import { networkIdToName } from '~/utils/networkIdToName'
import { displayWeiToEther } from '~/utils/displayWeiToEther'

function mapStateToProps(state, ownProps) {
  const networkId = get(state, 'sagaGenesis.network.networkId')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const networkName = networkIdToName(networkId)
  const workTokenAddress = contractByName(state, 'WorkToken')

  const ethBalance = get(state, 'sagaGenesis.ethBalance.balance')
  const tilwBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

  return {
    address,
    ethBalance,
    networkId,
    networkName,
    tilwBalance,
    workTokenAddress
  }
}

function* networkInfoSaga ({ address, workTokenAddress }) {
  console.log('networkInfoSaga')

  if (!address || !workTokenAddress) { return }
  console.log('networkInfoSaga POST')

  yield cacheCall(workTokenAddress, 'balanceOf', address)
}

export const NetworkInfo = withSaga(networkInfoSaga)(
  connect(mapStateToProps)(
    function({ address, ethBalance, networkName, tilwBalance }) {
      return (
        <div className="navbar-menu">
          <div className="navbar-end">
            <div className="navbar-item has-text-transparent-white">
              <span>
                <span className={classnames(`nav--circle`, `color-${networkName.toLowerCase()}` )} />
                &nbsp;
                {networkName}
              </span>
            </div>
            <div className="navbar-item has-text-transparent-white">
              {displayWeiToEther(tilwBalance)} TILW
            </div>
            <div className="navbar-item has-text-transparent-white">
              <EtherFlip wei={ethBalance} />
            </div>
            <div className="navbar-item has-text-transparent-white">
              <EthAddress address={address} disallowFull={true} />
            </div>
          </div>
        </div>
      )
    }
  )
)
