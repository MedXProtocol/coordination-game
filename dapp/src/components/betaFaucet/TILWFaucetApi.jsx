import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import { EthAddress } from '~/components/EthAddress'
import PropTypes from 'prop-types'
import { axiosInstance } from '~/../config/axiosConfig'
import { LoadingLines } from '~/components/LoadingLines'
import { TILW } from '~/components/TILW'
import TILWCoinImg from '~/assets/img/tilw-coin.svg'

export const TILWFaucetAPI = ReactTimeout(
  class _TILWFaucetAPI extends Component {

    faucetLambdaURI = `${process.env.REACT_APP_LAMBDA_BETA_FAUCET_ENDPOINT_URI}/betaFaucetSendTILW`

    constructor(props) {
      super(props)

      this.state = {
        isSending: false,
        errorMessage: '',
        response: {}
      }
    }

    handleMintTILW = (event) => {
      event.preventDefault()
      this.setState({
        isSending: true,
        errorMessage: '',
        response: {}
      }, this.doMintTILW)
    }

    doMintTILW = async () => {
      try {
        const response = await axiosInstance.get(`${this.faucetLambdaURI}?ethAddress=${this.props.address}`)

        if (response.status === 200) {
          this.setState({
            responseMessage: "We're sending you TILW",
            txHash: response.data.txHash
          })
          this.props.addExternalTransaction('sendTILW', response.data.txHash)
        } else {
          this.setState({
            responseMessage: '',
            errorMessage: `There was an error: ${response.data}`
          })

          this.props.setTimeout(() => {
            this.setState({
              isSending: false
            })
          }, 7000)
        }
      } catch (error) {
        this.setState({
          responseMessage: '',
          errorMessage: error.message
        })
        this.props.setTimeout(() => {
          this.setState({
            isSending: false
          })
        }, 7000)
      }
    }

    render () {
      const { isSending, responseMessage, errorMessage } = this.state

      if (errorMessage) {
        var englishErrorMessage = (
          <small>
            <br />
            There was an error while sending you TILW, you may have already received it or it's on the way. If the problem persists please contact MedX Protocol on Telegram and we can send you Testnet TILW:
            &nbsp; <a
              target="_blank"
              href="https://t.me/MedXProtocol"
              rel="noopener noreferrer">Contact Support</a>
          </small>
        )

        var errorParagraph = (
          <p className="text-danger">
            {errorMessage}
            {englishErrorMessage}
            <br />
            <br />
          </p>
        )
      }

      if (responseMessage) {
        var successParagraph = (
          <p>
            <strong>{responseMessage}</strong>
            <small>
              <br/>
              Please wait, this may take up to a couple of minutes ...
            </small>
            <br/>
            <br/>
          </p>
        )
      }

      const responseWell = (
        <div className="well beta-faucet--well">
          <br />
          <LoadingLines visible={isSending} /> &nbsp;
          <br />
          {successParagraph}
          {errorParagraph}
        </div>
      )

      return (
        <div>
          <img alt="tilw-coin-img" src={TILWCoinImg} width="100" />
          <h5 className="is-size-5">
            Current Balance: <TILW wei={this.props.tilwBalance} />
          </h5>
          <p className="small text-center">
            <span className="eth-address text-gray">For address:&nbsp;
              <EthAddress address={this.props.address} />
            </span>
          </p>
          <br />
          <p className="is-size-6">
            You're low on TILW which is necessary for staking a deposit to play the Coordination Game. We can send some to you now:
          </p>
          <br />
          <p>
            <a
              disabled={isSending}
              onClick={this.handleMintTILW}
              href={this.faucetLambdaURI}
              className="button is-light"
            >{isSending ? 'Sending ...' : 'Mint Me TILW'}</a>
          </p>
          {isSending || responseMessage || errorMessage ? responseWell : ''}
          <br />
          <br />
          <p>
            <button
              onClick={this.props.handleMoveToNextStep}
              className="button is-light is-text"
            >skip this for now</button>
          </p>
        </div>
      )
    }
  }
)

TILWFaucetAPI.propTypes = {
  tilwBalance: PropTypes.string,
  address: PropTypes.string
}
