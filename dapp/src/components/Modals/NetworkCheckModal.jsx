import React from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Modal } from '~/components/Modals/Modal'
import { requiredNetworkIds } from '~/services/requiredNetworkIds'
import { networkIdToName } from '~/utils/networkIdToName'

function mapStateToProps(state, ownProps) {
  const networkId = get(state, 'sagaGenesis.network.networkId')

  return {
    networkId
  }
}

export const NetworkCheckModal = connect(mapStateToProps)(
  function({ networkId }) {
    let showNetworkModal = false
    let requiredNetworkNames = []
    const networkIds = requiredNetworkIds()

    if (networkIds &&
        networkId &&
        !networkIds.includes(networkId)
    ) {
      requiredNetworkNames = networkIds.map(requiredNetworkId => networkIdToName(requiredNetworkId))
      showNetworkModal = true
    }

    const currentNetworkName = networkIdToName(networkId)

    return (
      <Modal
        closeModal={(e) => { e.preventDefault() }}
        modalState={showNetworkModal}
        title="Network Check Modal"
      >
        <div className='has-text-centered'>
          <h5 className="has-text-dark-grey is-size-5">
            This DApp requires your Web3 browser be set to the <strong className="has-text-info">{requiredNetworkNames.join(' or ')}</strong> network.
          </h5>
          <p className="is-size-7">
            (You are currently using the <strong className="has-text-dark-grey">{currentNetworkName}</strong> network)
          </p>
        </div>
      </Modal>
    )
  }
)
