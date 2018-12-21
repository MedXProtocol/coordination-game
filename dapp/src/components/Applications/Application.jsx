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
import {
  FormOutline
} from '@ant-design/icons'
import AntdIcon from '@ant-design/icons-react'
import { get } from 'lodash'
import { ApplicantRevealForm } from '~/components/Applications/ApplicantRevealForm'
import { LoadingButton } from '~/components/Helpers/LoadingButton'
import { RecordTimestampDisplay } from '~/components/Helpers/RecordTimestampDisplay'
import { ScrollToTop } from '~/components/Helpers/ScrollToTop'
import { Web3ActionButton } from '~/components/Helpers/Web3ActionButton'
import { applicationService } from '~/services/applicationService'
import { applicationSaga } from '~/sagas/applicationSaga'
import { WhistleblowButton } from '~/components/Applications/WhistleblowButton'
import { mapApplicationState } from '~/services/mapApplicationState'
import { getWeb3 } from '~/utils/getWeb3'
import * as routes from '~/../config/routes'
import { tickerToBytes32 } from '~/utils/tickerToBytes32'

function mapStateToProps(state, { match }) {
  const applicationId = tickerToBytes32(match.params.applicationId)

  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const tilRegistryAddress = contractByName(state, 'TILRegistry')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const latestBlockNumber = get(state, 'sagaGenesis.block.latestBlock.number')
  const transactions = get(state, 'sagaGenesis.transactions')

  const applicationObject = applicationService(state, applicationId, coordinationGameAddress, tilRegistryAddress)

  return {
    address,
    coordinationGameAddress,
    tilRegistryAddress,
    applicationId,
    applicationObject,
    latestBlockTimestamp,
    latestBlockNumber,
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

            const { send, coordinationGameAddress, applicationId, applicationObject } = this.props

            const secretAsHex = getWeb3().eth.abi.encodeParameter('uint256', this.state.secret.toString())

            const verifierSubmitSecretTxId = send(
              coordinationGameAddress,
              'verifierSubmitSecret',
              applicationId,
              secretAsHex
            )({
              value: applicationObject.game.applicationFeeWei
            })

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

            let submissionTitle = 'This submission is not yet in the registry'

            const {
              address,
              applicationObject,
              latestBlockNumber,
              latestBlockTimestamp
            } = this.props

            let {
              applicationId,
              createdAt,
              updatedAt,
              tokenTicker,
              tokenName,
              verifier,
              verifierSubmitSecretExpiresAt
            } = applicationObject

            if (createdAt) {
              var createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
              var updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />
              var updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={`@`} />
              var loadingOrUpdatedAtTimestamp = updatedAtDisplay

              var lastUpdatedTime =
                <React.Fragment>
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
                </React.Fragment>
            }


            const applicationState = mapApplicationState(
              address,
              applicationObject,
              latestBlockNumber,
              latestBlockTimestamp
            )

            if (applicationState.canWhistleblow) {
              whistleblowButton =
                <WhistleblowButton applicationId={applicationId} />
            }

            if (!applicationState.noWhistleblower) {
              message = (
                <div>
                  <p>
                    <span className="has-text-danger">Whistleblown!</span>
                    <br />
                    <strong>
                      The random number was leaked and a whistleblower successfully called this applicant out.
                    </strong>
                  </p>
                </div>
              )
            } else if (applicationState.isComplete) {
              if (applicationState.applicantWon) {
                submissionTitle = 'This submission was added to the registry'
              } else {
                submissionTitle = 'This submission was rejected'
              }

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
            }

            // APPLICANT:
            if (applicationState.isApplicant) {
              if (applicationState.needsApplicantReveal) {
                message = <ApplicantRevealForm
                  applicationObject={applicationObject}
                  coordinationGameAddress={this.props.coordinationGameAddress}
                  transactions={this.props.transactions}
                />
              } else if (applicationState.verifierHasChallenged) {
                message = <span className="has-text-warning">
                  You did not reveal your secret in time. Your verifier has closed the application. Please consider resubmitting another application.
                </span>
              } else if (applicationState.needsNewVerifier) {
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
              } else if (applicationState.needsAVerifier) {
                message = (
                  <React.Fragment>
                    <p>
                      This submission requires a verifier reviews it:
                      <br />
                      <br />
                    </p>

                    <span
                      data-tip={applicationState.waitingOnBlockToMine ? 'Please wait until the next block has mined' : ''}
                      data-for={`request-verification-tooltip`}
                    >
                      <Web3ActionButton
                        contractAddress={this.props.coordinationGameAddress}
                        method='applicantRandomlySelectVerifier'
                        args={[applicationId]}
                        buttonText='Request Verification'
                        loadingText='Requesting'
                        confirmationMessage='Verification request confirmed.'
                        disabled={applicationState.waitingOnBlockToMine}
                        txHashMessage='Verification request sent successfully -
                          it will take a few minutes to confirm on the Ethereum network.' />
                      <ReactTooltip
                        id={`request-verification-tooltip`}
                        html={true}
                        wrapper='span'
                      />
                    </span>
                  </React.Fragment>
                )
              }
            }


            if (applicationState.canChallenge) {
              message = (
                <div>
                  <p>
                    The applicant hasn't revealed their secret in the timeframe provided. You can close this application and collect your payment:
                    <br />
                    <br />
                  </p>
                  <Web3ActionButton
                    contractAddress={this.props.coordinationGameAddress}
                    method='verifierChallenge'
                    args={[applicationId]}
                    buttonText='Close and Collect Payment'
                    loadingText='Closing ...'
                    confirmationMessage='Close and Collect Payment transaction confirmed.'
                    txHashMessage='"Close and Collect Payment" transaction sent successfully -
                      it will take a few minutes to confirm on the Ethereum network.' />
                </div>
              )
            }

            // necessary to show the verifier on 1st-time component load
            ReactTooltip.rebuild()

            return (
              <div className='column is-10-widescreen is-offset-1-widescreen paper'>
                <ScrollToTop />

                <div className="has-text-right">
                  <button
                    className="is-warning is-outlined is-pulled-right delete is-large"
                    onClick={this.handleCloseClick}
                  >

                  </button>
                </div>

                <div className="columns">
                  <div className="column is-12">
                    <AntdIcon type={FormOutline} className="antd-icon paper--icon" />

                    <h6 className="is-size-6 has-text-grey-light application-num">
                      {submissionTitle}
                    </h6>
                  </div>
                </div>

                <div className="columns">
                  <div className="column is-6">
                    <h5 className="is-size-5 has-text-grey-lighter">
                      Project Name:
                    </h5>
                    <h3 className="is-size-3 has-text-grey">
                      {tokenName}
                    </h3>
                  </div>

                  <div className="column is-6">
                    <h5 className="is-size-5 has-text-grey-lighter">
                      Token Ticker:
                    </h5>
                    <h3 className="is-size-3 has-text-grey">
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

                      <LoadingButton
                        initialText='Submit Verification'
                        loadingText='Submitting'
                        isLoading={this.state.verifierSubmitSecretHandler}
                        disabled={!this.secretValid() || this.state.verifierSubmitSecretHandler}
                      />
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
                {lastUpdatedTime}
              </div>
            )
          }
        }
      )
    )
  )
)
