import ReactDOMServer from 'react-dom/server'
import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import ReactTooltip from 'react-tooltip'
import PropTypes from 'prop-types'
import {
  contractByName,
  withSaga,
  withSend
} from 'saga-genesis'
import { get } from 'lodash'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { ScrollToTop } from '~/components/ScrollToTop'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { applicationService } from '~/services/applicationService'
import { applicationSaga } from '~/sagas/applicationSaga'
import { defined } from '~/utils/defined'
import { getWeb3 } from '~/utils/getWeb3'
import { isBlank } from '~/utils/isBlank'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { match }) {
  let applicationObject = {}

  const applicationId = parseInt(match.params.applicationId, 10)

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')

  applicationObject = applicationService(state, applicationId, coordinationGameAddress)

  return {
    coordinationGameAddress,
    applicationId,
    applicationObject,
    latestBlockTimestamp
  }
}

function* viewApplicationSaga({ coordinationGameAddress, applicationId }) {
  if (!coordinationGameAddress || !applicationId) { return }

  yield applicationSaga({ coordinationGameAddress, applicationId })
}

export const Application = connect(mapStateToProps)(
  withSaga(viewApplicationSaga)(
    withSend(
      withRouter(
        class _Application extends Component {

          static propTypes = {
            applicationId: PropTypes.number
          }

          componentWillReceiveProps (nextProps) {
          }

          handleCloseClick = (e) => {
            e.preventDefault()

            // if applicant then registry or submit
            // if verifier then registry or verifications table

            this.props.history.push(routes.VERIFY)
          }

          render () {
            let message

            const {
              applicationObject,
              latestBlockTimestamp
            } = this.props

            let {
              applicantRevealExpiresAt,
              applicantsSecret,
              applicationId,
              createdAt,
              tokenTicker,
              tokenName,
              random,
              secret,
              updatedAt,
              verifierChallengedAt,
              verifier,
              verifiersSecret,
              verifierSubmitSecretExpiresAt
            } = applicationObject

            const verifierSubmittedSecret = !isBlank(verifiersSecret)
            const applicantRevealedSecret = !isBlank(applicantsSecret)
            const applicantWon = (applicantsSecret === verifiersSecret)

            const updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={`@`} />

            const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
            const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

            const loadingOrUpdatedAtTimestamp = updatedAtDisplay




            // START DUPLICATE CODE! (put in service?)
            const success = applicantRevealedSecret
            const waitingOnVerifier = (!isBlank(verifier) && !verifierSubmittedSecret)
            const needsApplicantReveal = (verifierSubmittedSecret && defined(random) && defined(secret))

            const verifierHasChallenged = (verifierChallengedAt !== 0)
            const applicantMissedRevealDeadline = (
              verifierSubmittedSecret && (latestBlockTimestamp > applicantRevealExpiresAt)
            )

            const needsAVerifier = (isBlank(verifier) && defined(tokenTicker) && defined(tokenName) && defined(secret) && defined(random))
            const needsNewVerifier = (!isBlank(verifier) && (latestBlockTimestamp > verifierSubmitSecretExpiresAt))
            // END DUPLICATE CODE



            if (success) {
              message = (
                <React.Fragment>
                  Submission Complete
                  <br />
                  <strong>
                    <abbr
                      data-for='expiration-message-tooltip'
                      data-tip={applicantWon ? `The Verifier entered the same contract address as you` : `The Verifier entered a different secret that did not match yours`}
                    >
                      {applicantWon ? `Contract Addresses Matched` : `Contract Addresses Did Not Match`}
                    </abbr>
                  </strong>
                </React.Fragment>
              )
            } else if (waitingOnVerifier) {
              message = (
                <React.Fragment>
                  <span className="has-text-grey">Waiting on <abbr data-tip={verifier} data-for='expiration-message-tooltip'>Verifier</abbr> until:</span>
                  <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={verifierSubmitSecretExpiresAt} />
                </React.Fragment>
              )
            } else if (needsApplicantReveal) {
              let secretAsHex

              if (secret) {
                secretAsHex = getWeb3().eth.abi.encodeParameter('uint256', secret.toString())
              }

              message = (
                <React.Fragment>
                  <span className="has-text-grey">Reveal your secret before:</span>
                  <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={applicantRevealExpiresAt} />
                  <br />
                    <Web3ActionButton
                      contractAddress={this.props.coordinationGameAddress}
                      method='applicantRevealSecret'
                      args={[applicationId, secretAsHex, random.toString()]}
                      buttonText='Reveal Secret'
                      loadingText='Revealing'
                      confirmationMessage='"Reveal Secret" transaction confirmed.'
                      txHashMessage='"Reveal Secret" transaction sent successfully -
                        it will take a few minutes to confirm on the Ethereum network.'/>
                </React.Fragment>
              )
            }

            if (verifierHasChallenged) {
              message = <span className="has-text-warning">Verifier challenged your application</span>
            } else if (applicantMissedRevealDeadline) {
              message = <span className="has-text-grey">You missed the reveal secret deadline</span>
            } else if (needsNewVerifier) {
              message = (
                <React.Fragment>
                  <span className="has-text-warning">Verifier Failed to Respond</span>
                  <Web3ActionButton
                    contractAddress={this.props.coordinationGameAddress}
                    method='applicantRandomlySelectVerifier'
                    args={[applicationId]}
                    buttonText='Request New Verifier'
                    loadingText='Requesting New Verifier'
                    confirmationMessage='New verifier request confirmed.'
                    txHashMessage='New verifier request sent successfully -
                      it will take a few minutes to confirm on the Ethereum network.' />
                </React.Fragment>
              )
            }

            if (needsAVerifier) {
              message = (
                <React.Fragment>
                  <p>
                    This submissions requires a verifier review it:
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

            return (
              <div className='column is-8-widescreen is-offset-2-widescreen'>
                <ScrollToTop />

                <div className="has-text-right">
                  <button
                    className="is-warning is-outlined is-pulled-right delete is-large"
                    onClick={this.handleCloseClick}
                  >

                  </button>
                </div>

                <h6 className="is-size-6 has-text-grey">
                  Token Submission #{applicationId}
                </h6>

                <br />

                <div className="columns">
                  <div className="column is-6">
                    <h3 className="is-size-3 has-text-grey-lighter">
                      Token Name:
                      <br />
                      <span className="has-text-grey-light">{tokenName}</span>
                    </h3>
                  </div>

                  <div className="column is-6">
                    <h3 className="is-size-3 has-text-grey-lighter">
                      Token Ticker:
                      <br />
                      <span className="has-text-grey-light">${tokenTicker}</span>
                    </h3>
                  </div>
                </div>

                <br />

                {message}

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
