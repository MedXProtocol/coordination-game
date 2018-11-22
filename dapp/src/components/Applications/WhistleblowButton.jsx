import React, {
  PureComponent
} from 'react'
import {
  contractByName
} from 'saga-genesis'
import { Modal } from '~/components/Modal'
import { connect } from 'react-redux'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { getWeb3 } from '~/utils/getWeb3'
import { isBlank } from '~/utils/isBlank'

function mapStateToProps(state) {
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')

  return {
    coordinationGameAddress
  }
}

export const WhistleblowButton = connect(mapStateToProps)(
  class _WhistleblowButton extends PureComponent {
    constructor(props) {
      super(props)
      this.state = {
        showWhistleblowModal: false,
        randomNumber: ''
      }
    }

    closeModal = () => {
      this.setState({ showWhistleblowModal: false, randomNumber: '' })
    }

    render () {
      const web3 = getWeb3()

      const {
        coordinationGameAddress,
        applicationId
      } = this.props

      const randomNumberHex = web3.eth.abi.encodeParameter('uint256', this.state.randomNumber).toString('hex')

      if (isBlank(coordinationGameAddress)) { return null }

      return (
        <React.Fragment>
          <p>
            If the applicant shared their random number with you then you
              can claim a reward and punish the cheater:
            <br />
            <br />
          </p>
          <button
            onClick={() => this.setState({ showWhistleblowModal: true })}
            className="button is-small is-outlined is-primary"
            >
            Whistleblow
          </button>
          <Modal
            closeModal={this.closeModal}
            modalState={this.state.showWhistleblowModal}
            title="Whistleblow"
          >
            <form onSubmit={this.handleWhistleblow}>
              <h6 className="is-size-6">
                Enter the applicant's leaked random number
              </h6>
              <input
                type="number"
                name="randomNumber"
                className="text-input text-input--extended"
                placeholder="random number"
                onChange={(e) => this.setState({randomNumber: e.target.value})}
                value={this.state.randomNumber}
              />
            </form>

            <Web3ActionButton
              contractAddress={coordinationGameAddress}
              method="whistleblow"
              args={[applicationId, randomNumberHex]}
              buttonText="Submit"
              isSmall={true}
              loadingText="Submitting..."
              confirmationMessage="Whistleblown successfully on this application"
              txHashMessage="Blowing the whistle on this application"
            />
          </Modal>
        </React.Fragment>
      )
    }
  }
)
