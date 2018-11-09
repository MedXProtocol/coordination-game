import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import PropTypes from 'prop-types'
import { toastr } from '~/toastr'
import { EthAddress } from '~/components/EthAddress'
import { TILW } from '~/components/TILW'
import { LoadingButton } from '~/components/LoadingButton'
import { axiosInstance } from '~/../config/axiosConfig'
import TILWCoinImg from '~/assets/img/tilw-coin.svg'

export const TILWFaucetApi = ReactTimeout(
  class _TILWFaucetApi extends Component {

    faucetLambdaURI = `${process.env.REACT_APP_LAMBDA_BETA_FAUCET_ENDPOINT_URI}/betaFaucetSendTILW`

    constructor(props) {
      super(props)

      this.state = {
        isSending: false
      }
    }

    handleMintTILW = (event) => {
      event.preventDefault()
      this.setState({
        isSending: true
      }, this.doMintTILW)
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

    doMintTILW = async () => {
      try {
        const response = await axiosInstance.get(`${this.faucetLambdaURI}?ethAddress=${this.props.address}`)

        if (response.status === 200) {
          this.setState({
            txHash: response.data.txHash
          })

          toastr.success("We're sending you TILW. It will take a few moments to arrive.")

          this.props.addExternalTransaction('sendTILW', response.data.txHash)
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
          <TILWCoinImg width="100" height="100" />
          <h5 className="is-size-5">
            Current Balance: <TILW wei={this.props.tilwBalance} />
          </h5>
          <p className="small">
            <span className="eth-address has-text-grey-light">For address:&nbsp;
              <EthAddress address={this.props.address} />
            </span>
          </p>
          <br />
          <p className="is-size-5">
            You're low on TILW
            <br />
            <span className="is-size-7 has-text-grey-light">
              TILW is necessary for staking a deposit to play the Coordination Game. We can send some to you now:
            </span>
          </p>

          <p>
            <br />

            <LoadingButton
              handleClick={this.handleMintTILW}
              initialText='Send Me TILW'
              loadingText='Sending'
              isLoading={isSending}
            />
          </p>
          <br />
          <p>
            <button
              onClick={this.props.handleMoveToNextStep}
              className="button is-light is-text is-size-7"
            >skip this for now</button>
          </p>
        </div>
      )
    }
  }
)

TILWFaucetApi.propTypes = {
  tilwBalance: PropTypes.object,
  address: PropTypes.string
}
