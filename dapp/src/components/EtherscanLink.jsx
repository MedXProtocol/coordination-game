import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'

function mapStateToProps(state) {
  const networkId = get(state, 'sagaGenesis.network.networkId')
  return {
    networkId
  }
}

export const EtherscanLink = connect(mapStateToProps)(class _EtherscanLink extends Component {
  static propTypes = {
    txHash: PropTypes.string,
    networkId: PropTypes.number
  }

  render () {
    const { txHash, networkId } = this.props
    if (!txHash) { return null }

    var url
    switch(networkId) {
      case 1:
        url = `https://etherscan.io/txHash/${txHash}`
        break
      case 3:
        url = `https://ropsten.etherscan.io/txHash/${txHash}`
        break
      case 4:
        url = `https://rinkeby.etherscan.io/txHash/${txHash}`
        break
      case 42:
        url = `https://kovan.etherscan.io/txHash/${txHash}`
        break
      case 1234:
        url = `https://localhost.etherscan.io/txHash/${txHash}`
        break
      // no default
    }

    var link = null
    if (url) {
      link =
        <a href={url} title='View on Etherscan' target="_blank" rel="noopener noreferrer">
          {this.props.children}
        </a>
    }

    return link
  }
})
