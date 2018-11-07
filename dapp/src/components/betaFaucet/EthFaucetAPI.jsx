import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEthereum } from '@fortawesome/free-brands-svg-icons'
import { toastr } from '~/toastr'
import { EthAddress } from '~/components/EthAddress'
import { EtherFlip } from '~/components/EtherFlip'
import { axiosInstance } from '~/../config/axiosConfig'

export const EthFaucetAPI = ReactTimeout(
  class _EthFaucetAPI extends Component {

    faucetLambdaURI = `${process.env.REACT_APP_LAMBDA_BETA_FAUCET_ENDPOINT_URI}/betaFaucetSendEther`

    constructor(props) {
      super(props)

      this.state = {
        isSending: false
      }
    }

    handleSendEther = (event) => {
      event.preventDefault()
      this.setState({
        isSending: true
      }, this.doSendEther)
    }

    englishErrorMessage = (message) => {
      return 'There was an error (you may have been sent this previously). If the problem persists please contact MedX Protocol on Telegram'
    }

    showToastrError = (message) => {
      toastr.error(this.englishErrorMessage(message),
        {
          url: 'https://t.me/MedXProtocol',
          text: 'Contact Support'
        }
      )
    }

    doSendEther = async () => {
      try {
        const response = await axiosInstance.get(`${this.faucetLambdaURI}?ethAddress=${this.props.address}`)

        if (response.status === 200) {
          this.setState({
            txHash: response.data.txHash
          })

          toastr.success("We're sending you Ether - It will take a few moments to arrive.")

          this.props.addExternalTransaction('sendEther', response.data.txHash)
          this.props.setTimeout(() => {
            this.props.handleMoveToNextStep()
          }, 2000)
        } else {
          this.showToastrError(response.data)

          this.props.setTimeout(() => {
            this.setState({
              isSending: false
            })
          }, 1000)
        }
      } catch (error) {
        this.showToastrError(error.message)

        this.props.setTimeout(() => {
          this.setState({
            isSending: false
          })
        }, 1000)
      }
    }

    render () {
      const { isSending } = this.state

      return (
        <div>
          <FontAwesomeIcon icon={faEthereum} width="100" />
          <h5 className="is-size-5">
            Current Balance:
            &nbsp; <EtherFlip wei={this.props.ethBalance} />
          </h5>
          <p className="small">
            <span className="eth-address has-text-grey-light">For address:&nbsp;
              <EthAddress address={this.props.address} />
            </span>
          </p>
          <br />
          <p className="is-size-5">
            You're low on Ether
            <br />
            <span className="is-size-7 has-text-grey-light">
              Not to worry! We can have some sent to your account:
            </span>
          </p>
          <p>
            <br />
            <a
              disabled={isSending}
              href={this.faucetLambdaURI}
              onClick={this.handleSendEther}
              className="button is-primary is-outlined"
            >{isSending ? 'Sending ...' : 'Send Me Ether'}</a>
          </p>
          <br />
          <p>
            <button
              onClick={this.props.handleMoveToNextStep}
              className="button is-light is-text is-small"
            >skip this for now</button>
          </p>
        </div>
      )
    }
  }
)

EthFaucetAPI.propTypes = {
  ethBalance: PropTypes.string,
  address: PropTypes.string
}
