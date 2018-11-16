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
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { ScrollToTop } from '~/components/ScrollToTop'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { applicationService } from '~/services/applicationService'
import { applicationSaga } from '~/sagas/applicationSaga'
import { isBlank } from '~/utils/isBlank'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { match }) {
  let applicationObject = {}

  const applicationId = parseInt(match.params.applicationId, 10)
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')

  applicationObject = applicationService(state, applicationId, coordinationGameAddress)

  return {
    coordinationGameAddress,
    applicationId,
    applicationObject
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
            let expirationMessage
            const { applicationObject } = this.props

            expirationMessage = (
              <React.Fragment>
                Fill me in!
              </React.Fragment>
            )

            let {
              applicationId,
              createdAt,
              updatedAt,
              random,
              secret,
              tokenTicker,
              tokenName,
              verifier
            } = applicationObject

            const updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={`@`} />

            const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
            const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

            const loadingOrUpdatedAtTimestamp = updatedAtDisplay

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

                <h5 className="is-size-5 has-text-grey-dark">
                  Token Submission #{applicationId}
                </h5>

                <br />

                {isBlank(verifier) && tokenTicker && tokenName && secret && random
                  ? (
                      <Web3ActionButton
                        contractAddress={this.props.coordinationGameAddress}
                        method='applicantRandomlySelectVerifier'
                        args={[applicationId]}
                        buttonText='Request Verification'
                        loadingText='Requesting'
                        isSmall={true}
                        confirmationMessage='Verification request confirmed.'
                        txHashMessage='Verification request sent successfully -
                          it will take a few minutes to confirm on the Ethereum network.' />
                    )
                  : expirationMessage
                }

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
