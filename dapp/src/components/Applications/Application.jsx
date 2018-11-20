import ReactDOMServer from 'react-dom/server'
import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { toastr } from '~/toastr'
import ReactTooltip from 'react-tooltip'
import PropTypes from 'prop-types'
import {
  contractByName,
  TransactionStateHandler,
  withSaga,
  withSend
} from 'saga-genesis'
import { get } from 'lodash'
import { AppId } from '~/components/AppId'
import { LoadingButton } from '~/components/LoadingButton'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { applicationService } from '~/services/applicationService'
import { applicationSaga } from '~/sagas/applicationSaga'
import { WhistleblowButton } from '~/components/Applications/WhistleblowButton'
import { mapApplicationState } from '~/services/mapApplicationState'
import { getWeb3 } from '~/utils/getWeb3'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { match }) {
  const applicationId = match.params.applicationId

  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const transactions = get(state, 'sagaGenesis.transactions')

  const applicationObject = applicationService(state, applicationId, coordinationGameAddress)

  return {
    address,
    coordinationGameAddress,
    applicationId,
    applicationObject,
    latestBlockTimestamp,
    transactions
  }
}

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

export const Application = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(applicationSaga)(
    withSend(
      withRouter(
        class _Application extends Component {

          static propTypes = {
            applicationId: PropTypes.string
          }

          constructor(props) {
            super(props)
            this.state = {
              secret: ''
            }
          }

          componentWillReceiveProps (nextProps) {
            this.registerVerifierSubmitSecretHandlers(nextProps)
          }

          registerVerifierSubmitSecretHandlers = (nextProps) => {
            if (this.state.verifierSubmitSecretHandler) {
              this.state.verifierSubmitSecretHandler.handle(
                nextProps.transactions[this.state.verifierSubmitSecretTxId]
              )
                .onError((error) => {
                  this.props.dispatchHideLoadingStatus()

                  console.log(error)
                  this.setState({ verifierSubmitSecretHandler: null })
                  toastr.transactionError(error)
                })
                .onConfirmed(() => {
                  this.setState({ verifierSubmitSecretHandler: null })
                  toastr.success(`Verification secret transaction for application #${this.props.applicationId} has been confirmed.`)
                })
                .onTxHash(() => {
                  this.props.dispatchHideLoadingStatus()

                  this.setState({ loading: false })
                  toastr.success('Verification secret sent - it will take a few minutes to confirm on the Ethereum network.')
                  this.props.history.push(routes.VERIFY)
                })
            }
          }

          handleVerifierSecretSubmit = (e) => {
            e.preventDefault()

            const { send, coordinationGameAddress, applicationId } = this.props

            const secretAsHex = getWeb3().eth.abi.encodeParameter('uint256', this.state.secret.toString())

            const verifierSubmitSecretTxId = send(
              coordinationGameAddress,
              'verifierSubmitSecret',
              applicationId,
              secretAsHex
            )()

            this.setState({
              verifierSubmitSecretHandler: new TransactionStateHandler(),
              verifierSubmitSecretTxId
            })

            this.props.dispatchShowLoadingStatus()
          }

          handleTextInputChange = (e) => {
            this.setState({
              [e.target.name]: e.target.value
            })
          }

          handleCloseClick = (e) => {
            e.preventDefault()

            this.props.history.goBack()
          }

          secretValid = () => {
            return this.state.secret.length === 42 && this.state.secret.match(/^(0x)?[0-9a-fA-F]{40}$/)
          }

          render () {
            let message,
              whistleblowButton

            const {
              address,
              applicationObject,
              latestBlockTimestamp
            } = this.props

            let {
              applicantRevealExpiresAt,
              applicationId,
              createdAt,
              updatedAt,
              random,
              secret,
              tokenTicker,
              tokenName,
              verifier,
              verifierSubmitSecretExpiresAt
            } = applicationObject

            const updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={`@`} />

            const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
            const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

            const loadingOrUpdatedAtTimestamp = updatedAtDisplay

            const applicationState = mapApplicationState(address, applicationObject, latestBlockTimestamp)

            if (applicationState.canWhistleblow) {
              whistleblowButton =
                <WhistleblowButton applicationId={applicationId} />
            }



            if (applicationState.isComplete) {
              message = (
                <div>
                  <p>
                    <span className="has-text-info">Submission Complete</span>
                    <br />
                    <strong>
                      <abbr
                        data-for='message-tooltip'
                        data-tip={applicationState.applicantWon ? `The Verifier entered the same contract address as you` : `The Verifier entered a different secret that did not match yours`}
                      >
                        {applicationState.applicantWon ? `Contract Addresses Matched` : `Contract Addresses Did Not Match`}
                      </abbr>
                    </strong>
                  </p>
                </div>
              )
            } else if (applicationState.waitingOnVerifier) {
              message = (
                <p>
                  <strong>Waiting on <abbr data-tip={verifier} data-for='message-tooltip'>Verifier</abbr> until:</strong>
                  <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={verifierSubmitSecretExpiresAt} />
                </p>
              )
            } else if (applicationState.needsApplicantReveal) {
              let secretAsHex

              if (secret) {
                secretAsHex = getWeb3().eth.abi.encodeParameter('uint256', secret.toString())
              }

              message = (
                <div>
                  <p>
                    <strong>Reveal your secret before:</strong>
                    <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={applicantRevealExpiresAt} />
                    <br />
                    <br />
                  </p>
                  <Web3ActionButton
                    contractAddress={this.props.coordinationGameAddress}
                    method='applicantRevealSecret'
                    args={[applicationId, secretAsHex, random.toString()]}
                    buttonText='Reveal Secret'
                    loadingText='Revealing'
                    confirmationMessage='"Reveal Secret" transaction confirmed.'
                    txHashMessage='"Reveal Secret" transaction sent successfully -
                      it will take a few minutes to confirm on the Ethereum network.'/>
                </div>
              )
            }

            if (applicationState.isApplicant && applicationState.applicantRevealedSecret && applicationState.verifierHasChallenged) {
              message = <span className="has-text-warning">Verifier challenged your application</span>
            } else if (applicationState.isApplicant && applicationState.applicantMissedRevealDeadline) {
              message = <strong>You missed the reveal secret deadline</strong>
            } else if (applicationState.isApplicant && applicationState.needsNewVerifier) {
              message = (
                <div>
                  <h4 className="has-text-warning">
                    Verifier Failed to Respond:
                    <br />
                  </h4>
                  <Web3ActionButton
                    contractAddress={this.props.coordinationGameAddress}
                    method='applicantRandomlySelectVerifier'
                    args={[applicationId]}
                    buttonText='Request New Verifier'
                    loadingText='Requesting New Verifier'
                    confirmationMessage='New verifier request confirmed.'
                    txHashMessage='New verifier request sent successfully -
                      it will take a few minutes to confirm on the Ethereum network.' />
                </div>
              )
            }

            if (applicationState.isApplicant && applicationState.needsAVerifier) {
              message = (
                <React.Fragment>
                  <p>
                    This submission requires a verifier review it:
                    <br />
                    <br />
                  </p>
                  <Web3ActionButton
                    contractAddress={this.props.coordinationGameAddress}
                    method='applicantRandomlySelectVerifier'
                    args={[applicationId]}
                    buttonText='Request Verification'
                    loadingText='Requesting'
                    confirmationMessage='Verification request confirmed.'
                    txHashMessage='Verification request sent successfully -
                      it will take a few minutes to confirm on the Ethereum network.' />
                </React.Fragment>
              )
            }

            if (applicationState.canChallenge) {
              message = (
                <div>
                  <p>
                    The applicant hasn't revealed their secret in the timeframe provided. You can now challenge this application:
                    <br />
                    <br />
                  </p>
                  <Web3ActionButton
                    contractAddress={this.props.coordinationGameAddress}
                    method='verifierChallenge'
                    args={[applicationId]}
                    buttonText='Challenge'
                    loadingText='Challenging'
                    confirmationMessage='Challenge transaction confirmed.'
                    txHashMessage='"Challenge" transaction sent successfully -
                      it will take a few minutes to confirm on the Ethereum network.' />
                </div>
              )
            }

            // necessary to show the verifier on 1st-time component load
            ReactTooltip.rebuild()

            return (
              <div className='column is-8-widescreen is-offset-2-widescreen paper'>
                <div className="has-text-right">
                  <button
                    className="is-warning is-outlined is-pulled-right delete is-large"
                    onClick={this.handleCloseClick}
                  >

                  </button>
                </div>

                <h6 className="is-size-6 has-text-grey application-num">
                  <AppId applicationId={applicationId} />
                </h6>

                <div className="columns">
                  <div className="column is-6">
                    <h5 className="is-size-5 has-text-grey-lighter">
                      Token Name:
                    </h5>
                    <h3 className="is-size-3 has-text-grey-light">
                      {tokenName}
                    </h3>
                  </div>

                  <div className="column is-6">
                    <h5 className="is-size-5 has-text-grey-lighter">
                      Token Ticker:
                    </h5>
                    <h3 className="is-size-3 has-text-grey-light">
                      ${tokenTicker}
                    </h3>
                  </div>
                </div>

                {applicationState.canVerify
                  ? (
                    <form onSubmit={this.handleVerifierSecretSubmit}>
                      <h6 className="is-size-6">
                        Enter this token's contract address to verify:
                      </h6>

                      <div className="field">
                        <div className="control">
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
                        </div>
                        {(this.state.secret.length === 42 && !this.secretValid()) ? <span className="help has-text-grey">Please enter a valid contract address</span> : null }
                      </div>

                      {
                        this.secretValid()
                          ? (
                            <LoadingButton
                              initialText='Submit Verification'
                              loadingText='Submitting'
                              isLoading={this.state.verifierSubmitSecretHandler}
                              disabled={this.state.verifierSubmitSecretHandler}
                            />
                          )
                          : (
                            null
                          )
                      }
                    </form>
                  ) : (
                    <React.Fragment>
                      {message}
                      <ReactTooltip
                        id='message-tooltip'
                        html={true}
                        effect='solid'
                        place={'top'}
                        wrapper='span'
                      />
                    </React.Fragment>
                  )
                }

                <br />
                {whistleblowButton}
                <br />
                <br />

                <p className="is-size-7 has-text-grey-lighter">
                  <span data-tip={`Created: ${ReactDOMServer.renderToStaticMarkup(createdAtTooltip)}
                      ${ReactDOMServer.renderToStaticMarkup(<br/>)}
                      Last Updated: ${ReactDOMServer.renderToStaticMarkup(updatedAtTooltip)}`}>
                    <ReactTooltip
                      html={true}
                      effect='solid'
                      place={'top'}
                      wrapper='span'
                    />
                    <strong>Last Updated:</strong> {loadingOrUpdatedAtTimestamp}
                  </span>
                </p>
              </div>
            )
          }
        }
      )
    )
  )
)
