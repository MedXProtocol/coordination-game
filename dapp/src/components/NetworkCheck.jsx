import React from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import classnames from 'classnames'
import { EtherFlip } from '~/components/EtherFlip'
import { EthAddress } from '~/components/EthAddress'
import { networkIdToName } from '~/utils/networkIdToName'

function mapStateToProps(state, ownProps) {
  const networkId = get(state, 'sagaGenesis.network.networkId')
  const networkName = networkIdToName(networkId)
  const ethBalance = get(state, 'sagaGenesis.ethBalance.balance')
  const address = get(state, 'sagaGenesis.accounts[0]')

  return {
    address,
    ethBalance,
    networkId,
    networkName
  }
}

export const NetworkCheck = connect(mapStateToProps)(
  function({ address, ethBalance, networkName }) {
    return (
      <div className="navbar-menu">
        <div className="navbar-end">
          <div className="navbar-item">
            <span>
              <span className={classnames(`nav--circle`, `color-${networkName.toLowerCase()}` )} />
              &nbsp;
              {networkName}
            </span>
          </div>
          <div className="navbar-item">
            <EtherFlip wei={ethBalance} />
          </div>
          <div className="navbar-item">
            <EthAddress address={address} />
          </div>
        </div>
      </div>
    )
  }
)
