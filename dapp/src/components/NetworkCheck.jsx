import React from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { EtherFlip } from '~/components/EtherFlip'
import { EthAddress } from '~/components/EthAddress'
import { networkIdToName } from '~/utils/networkIdToName'

function mapStateToProps(state, ownProps) {
  const networkId = get(state, 'sagaGenesis.network.networkId')
  const networkName = networkIdToName(networkId)

  return {
    ethBalance: 100000000000,
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
            <span className="has-text-success">{'\u2b24'}</span> &nbsp; {networkName}
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
