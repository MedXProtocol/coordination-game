import React, {
  PureComponent
} from 'react'
import PropTypes from 'prop-types'
import { Web3ActionButton } from '~/components/Helpers/Web3ActionButton'

export class VerifierStakeWithdraw extends PureComponent {
  static propTypes = {
    workContractAddress: PropTypes.string.isRequired,
    message: PropTypes.string
  }

  static defaultProps = {
    message: "If you wish to withdraw your stake and cease being a verifier you may do so."
  }

  render () {
    return (
      <React.Fragment>
        <div className="columns">
          <div className="column is-8">
            <h6 className="is-size-6">
              Withdraw Stake
            </h6>
            <p>
              {this.props.message}
              <br />
              <br />
            </p>

            <Web3ActionButton
              contractAddress={this.props.workContractAddress}
              method='withdrawStake'
              buttonText='Withdraw'
              loadingText='Withdrawing...'
              confirmationMessage='"Withdraw" transaction confirmed.'
              txHashMessage='"Withdraw" transaction sent successfully -
                it will take a few minutes to confirm on the Ethereum network.' />
          </div>
        </div>
      </React.Fragment>
    )
  }
}
