import React, { Component } from 'react'
import { connect } from 'react-redux'

function mapDispatchToProps(dispatch) {
  return {
    dispatchShowBetaFaucetModal: () => {
      dispatch({ type: 'SHOW_BETA_FAUCET_MODAL', manuallyOpened: true })
    }
  }
}

export const GetTEXLink = connect(null, mapDispatchToProps)(
  class _GetTEXLink extends Component {
    render() {
      return (
        <button
          onClick={this.props.dispatchShowBetaFaucetModal}
          className="button is-outlined is-primary"
        >
          Get TEX
        </button>
      )
    }
  }
)
