import ReactDOMServer from 'react-dom/server'
import React, { PureComponent } from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import ReactTooltip from 'react-tooltip'
import PropTypes from 'prop-types'
import { toastr } from '~/toastr'
import { get } from 'lodash'
import {
  contractByName,
  TransactionStateHandler,
  withSaga,
  withSend
} from 'saga-genesis'
import { AppId } from '~/components/AppId'
import { LoadingButton } from '~/components/LoadingButton'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { applicationSaga } from '~/sagas/applicationSaga'
import { applicationService } from '~/services/applicationService'
import { mapApplicationState } from '~/services/mapApplicationState'
import { getWeb3 } from '~/utils/getWeb3'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { match }) {
  let applicationObject = {}

  const applicationId = match.params.applicationId

  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const transactions = get(state, 'sagaGenesis.transactions')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')

  applicationObject = applicationService(state, applicationId, coordinationGameAddress)

  return {
    address,
    applicationId,
    applicationObject,
    coordinationGameAddress,
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

export const VerifyApplication = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(applicationSaga)(
    withSend(
      withRouter(
        class _VerifyApplication extends PureComponent {

          constructor(props) {
            super(props)
            this.state = {
              secret: ''
            }
          }

          static propTypes = {
            applicationId: PropTypes.string
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

          handleCloseClick = (e) => {
            e.preventDefault()

            this.props.history.push(routes.VERIFY)
          }

          handleTextInputChange = (e) => {
            this.setState({
              [e.target.name]: e.target.value
            })
          }

          secretValid = () => {
            return this.state.secret.length === 42 && this.state.secret.match(/^(0x)?[0-9a-fA-F]{40}$/)
          }

          render () {
            const {
              address,
              applicationObject,
              latestBlockTimestamp
            } = this.props

            let {
              applicationId,
              createdAt,
              updatedAt,
              tokenTicker,
              tokenName
            } = applicationObject

            const applicationState = mapApplicationState(address, applicationObject, latestBlockTimestamp)

            const updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={`@`} />

            const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
            const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

            const loadingOrUpdatedAtTimestamp = updatedAtDisplay



            let challengeAction
            if (applicationState.canChallenge) {
              challengeAction = (
                <Web3ActionButton
                  contractAddress={this.props.coordinationGameAddress}
                  method='verifierChallenge'
                  args={[applicationId]}
                  buttonText='Challenge'
                  loadingText='Challenging'
                  confirmationMessage='Challenge transaction confirmed.'
                  txHashMessage='"Challenge" transaction sent successfully -
                    it will take a few minutes to confirm on the Ethereum network.' />
              )
            }

            return (
              <div className='column is-8-widescreen is-offset-2-widescreen paper'>
                <div className="has-text-right">
                  <button
                    className="is-warning is-outlined is-pulled-right delete is-large"
                    onClick={this.handleCloseClick}
                  >

                  </button>
                </div>

                <h5 className="is-size-5 has-text-grey-dark">
                  Token Submission <AppId applicationId={applicationId} />
                </h5>

                <br />

                <div className="columns">
                  <div className="column is-6">
                    <h3 className="is-size-3 has-text-grey">
                      Token Name:
                      <br />
                      <span className="has-text-grey-light">{tokenName}</span>
                    </h3>
                  </div>

                  <div className="column is-6">
                    <h3 className="is-size-3 has-text-grey">
                      Token Ticker:
                      <br />
                      <span className="has-text-grey-light">${tokenTicker}</span>
                    </h3>
                  </div>
                </div>

                <br />

                {applicationState.canChallenge
                  ? (
                    <div>
                      <p>
                        The applicant hasn't revealed their secret in the timeframe provided. You can now challenge this application:
                        <br />
                        <br />
                      </p>
                      {challengeAction}
                    </div>
                  ) : applicationState.canVerify
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
                        ) : null
                }



                <br />
                <br />

                <p className="has-text-centered is-size-7 has-text-grey-lighter">
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
