import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { defined } from '~/utils/defined'
import { isBlank } from '~/utils/isBlank'

function mapStateToProps(state) {
  const networkId = get(state, 'sagaGenesis.network.networkId')
  return {
    networkId
  }
}

export const EtherscanLink = connect(mapStateToProps)(class _EtherscanLink extends Component {
  static propTypes = {
    address: PropTypes.string,
    txHash: PropTypes.string,
    networkId: PropTypes.number
  }

  render () {
    let link,
      url

    const { address, txHash, networkId } = this.props

    if (!txHash && !address) {
      return null
    } else {
      switch(networkId) {
        case 1:
          url = `https://etherscan.io`
          break
        case 3:
          url = `https://ropsten.etherscan.io`
          break
        case 4:
          url = `https://rinkeby.etherscan.io`
          break
        case 42:
          url = `https://kovan.etherscan.io`
          break
        case 1234:
          url = `https://localhost.etherscan.io`
          break
        // no default
      }

      if (defined(txHash)) {
        url = `${url}/tx/${txHash}`
      } else if (!isBlank(address)) {
        url = `${url}/address/${address}`
      }

      if (url) {
        link =
          <a href={url} title='View on Etherscan' target="_blank" rel="noopener noreferrer">
            {this.props.children}
          </a>
      }
    }

    return link
  }
})
