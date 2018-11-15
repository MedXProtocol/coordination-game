import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import PropTypes from 'prop-types'
import { toastr } from '~/toastr'
import { EthAddress } from '~/components/EthAddress'
import { TEX } from '~/components/TEX'
import { LoadingButton } from '~/components/LoadingButton'
import { axiosInstance } from '~/../config/axiosConfig'
import TEXCoinImg from '~/assets/img/tex-coin.svg'

export const TEXFaucetAPI = ReactTimeout(
  class _TEXFaucetAPI extends Component {

    faucetLambdaURI = `${process.env.REACT_APP_LAMBDA_BETA_FAUCET_ENDPOINT_URI}/betaFaucetSendTEX`

    constructor(props) {
      super(props)

      this.state = {
        isSending: false
      }
    }

    handleMintTEX = (event) => {
      event.preventDefault()
      this.setState({
        isSending: true
      }, this.doMintTEX)
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

    doMintTEX = async () => {
      try {
        const response = await axiosInstance.get(`${this.faucetLambdaURI}?ethAddress=${this.props.address}`)

        const txId = this.props.sendExternalTransaction('sendTEX')

        if (response.status === 200) {
          this.setState({
            txHash: response.data.txHash
          })

          toastr.success("We're sending you TEX. It will take a few moments to arrive.")

          this.props.dispatchSagaGenesisTxHash(txId, response.data.txHash)

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
          <TEXCoinImg width="100" height="100" />
          <h5 className="is-size-5">
            Current Balance: <TEX wei={this.props.texBalance} />
          </h5>
          <p className="small">
            <span className="eth-address has-text-grey-light">For address:&nbsp;
              <EthAddress address={this.props.address} />
            </span>
          </p>
          <br />
          <p className="is-size-5">
            You're low on TEX
            <br />
            <span className="is-size-7 has-text-grey-light">
              TEX is necessary for staking a deposit to play the Coordination Game. We can send some to you now:
            </span>
          </p>

          <p>
            <br />

            <LoadingButton
              handleClick={this.handleMintTEX}
              initialText='Send Me TEX'
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

TEXFaucetAPI.propTypes = {
  texBalance: PropTypes.object,
  address: PropTypes.string
}
