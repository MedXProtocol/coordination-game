import React, { Component } from 'react'
import { toastr } from '~/toastr'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import {
  TransactionStateHandler,
  withSend
} from 'saga-genesis'
import { LoadingButton } from '~/components/LoadingButton'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { defined } from '~/utils/defined'
import { getWeb3 } from '~/utils/getWeb3'

function mapDispatchToProps(dispatch) {
  return {
    dispatchShowLoadingStatus: () => {
      dispatch({ type: 'SHOW_LOADING_STATUS' })
    },
    dispatchHideLoadingStatus: () => {
      dispatch({ type: 'HIDE_LOADING_STATUS' })
    }
  }
}

export const ApplicantRevealForm = connect(null, mapDispatchToProps)(
  withSend(
    class _ApplicantRevealForm extends Component {

      static propTypes = {
        applicationObject: PropTypes.object.isRequired,
        coordinationGameAddress: PropTypes.string.isRequired,
        transactions: PropTypes.object.isRequired
      }

      constructor(props) {
        super(props)
        this.state = {
          secret: '',
          random: ''
        }
      }

      componentWillReceiveProps (nextProps) {
        this.registerApplicantRevealHandlers(nextProps)
      }

      registerApplicantRevealHandlers = (nextProps) => {
        if (this.state.applicantRevealHandler) {
          this.state.applicantRevealHandler.handle(
            nextProps.transactions[this.state.applicantRevealTxId]
          )
            .onError((error) => {
              this.props.dispatchHideLoadingStatus()

              console.log(error)
              this.setState({ applicantRevealHandler: null })
              toastr.transactionError(error)
            })
            .onConfirmed(() => {
              this.setState({ applicantRevealHandler: null })
              toastr.success(`Reveal transaction for application #${this.props.applicationObject.applicationId} has been confirmed.`)
            })
            .onTxHash(() => {
              this.props.dispatchHideLoadingStatus()

              this.setState({ loading: false })
              toastr.success('Reveal transaction sent - it will take a few minutes to confirm on the Ethereum network.')
            })
        }
      }

      handleApplicantRevealSubmit = (e) => {
        e.preventDefault()

        let randomToSubmit,
          hexSecretToSubmit

        const { send, coordinationGameAddress, applicationObject } = this.props

        if (applicationObject.secret) {
          hexSecretToSubmit = applicationObject.secret
        } else {
          hexSecretToSubmit = this.state.secret.toString()
        }
        hexSecretToSubmit = getWeb3().eth.abi.encodeParameter('uint256', hexSecretToSubmit)


        if (applicationObject.random) {
          randomToSubmit = applicationObject.random
        } else {
          randomToSubmit = this.state.random
        }

        const applicantRevealTxId = send(
          coordinationGameAddress,
          'applicantRevealSecret',
          applicationObject.applicationId,
          hexSecretToSubmit,
          randomToSubmit
        )()

        this.setState({
          applicantRevealHandler: new TransactionStateHandler(),
          applicantRevealTxId
        })

        this.props.dispatchShowLoadingStatus()
      }

      formReady = () => {
        return (
          this.secretValid()
          && this.state.random.length > 0
        )
      }

      handleTextInputChange = (e) => {
        this.setState({
          [e.target.name]: e.target.value
        })
      }

      secretValid = () => {
        return this.state.secret.length === 42 && this.state.secret.match(/^(0x)?[0-9a-fA-F]{40}$/)
      }

      secretAndRandomFromLocalStorage = () => {
        return defined(this.props.applicationObject.secret) && defined(this.props.applicationObject.random)
      }

      render () {
        if (!defined(this.props.applicationObject)) {
          return null
        }

        let secretAsHex

        const {
          applicationObject
        } = this.props

        let {
          applicantRevealExpiresAt,
          applicationId,
          random,
          secret
        } = applicationObject

        if (secret) {
          secretAsHex = getWeb3().eth.abi.encodeParameter('uint256', secret.toString())
        }

        console.log(this.secretAndRandomFromLocalStorage())

        return (
          <React.Fragment>
            <div>
              <p className="is-size-6">
                <strong>To complete the application you must reveal your secret before:</strong>
                <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={applicantRevealExpiresAt} />
                <br />
                <br />
              </p>

              {this.secretAndRandomFromLocalStorage() ?
                <Web3ActionButton
                  contractAddress={this.props.coordinationGameAddress}
                  method='applicantRevealSecret'
                  args={[applicationId, secretAsHex, random.toString()]}
                  buttonText='Reveal Secret'
                  loadingText='Revealing'
                  confirmationMessage='"Reveal Secret" transaction confirmed.'
                  txHashMessage='"Reveal Secret" transaction sent successfully -
                    it will take a few minutes to confirm on the Ethereum network.'/>
                : (
                  <form onSubmit={this.handleApplicantRevealSubmit}>
                    <hr />
                    <h6 className="is-size-6">
                      Enter the random number that was generated for this application:
                      <br /><span className="help has-text-grey-dark">(from your CSV backup)</span>
                    </h6>

                    <div className="field">
                      <p className="control">
                        <input
                          maxLength="40"
                          type="text"
                          name="random"
                          className="text-input text-input--large text-input--extended is-marginless"
                          placeholder=""
                          onChange={this.handleTextInputChange}
                        />
                      </p>
                    </div>

                    <h6 className="is-size-6">
                      And the secret (from your backup):
                    </h6>

                    <div className="field">
                      <p className="control">
                        <input
                          type="text"
                          name="secret"
                          className="text-input text-input--large text-input--extended-extra is-marginless"
                          placeholder="0x..."
                          maxLength="42"
                          pattern="^(0x)?[0-9a-fA-F]{40}$"
                          onChange={this.handleTextInputChange}
                          value={this.state.secret}
                        />
                      </p>
                      {(this.state.secret.length === 42 && !this.secretValid()) ? <span className="help has-text-grey">Please enter a valid hexadecimal address</span> : null }
                    </div>

                    <LoadingButton
                      initialText='Reveal Secret'
                      loadingText='Revealing ...'
                      isLoading={this.state.applicantRevealHandler}
                      disabled={!this.formReady() || this.state.applicantRevealHandler}
                    />
                  </form>
                )
              }

            </div>

          </React.Fragment>
        )
      }
    }
  )
)
