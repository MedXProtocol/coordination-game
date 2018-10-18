import React from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { EtherFlip } from '~/components/EtherFlip'
import { EthAddress } from '~/components/EthAddress'
import { networkIdToName } from '~/utils/networkIdToName'

function mapStateToProps(state, ownProps) {
  const networkId = get(state, 'sagaGenesis.network.networkId')
  const networkName = networkIdToName(networkId)
  const ethBalance = get(state, 'sagaGenesis.ethBalance.balance')

  return {
    ethBalance,
    networkId,
    networkName
  }
}

export const NetworkCheck = connect(mapStateToProps)(
  function({ ethBalance, networkName }) {
    return (
      <div className="navbar-menu">
        <div className="navbar-end">
          <div className="navbar-item">
            <span>
              <span className='nav--circle color-localhost' />
              &nbsp;
              {networkName}
            </span>
          </div>
          <div className="navbar-item">
            <EtherFlip wei={ethBalance} />
          </div>
          <div className="navbar-item">
            <EthAddress  />
          </div>
        </div>
      </div>
    )
  }
)
