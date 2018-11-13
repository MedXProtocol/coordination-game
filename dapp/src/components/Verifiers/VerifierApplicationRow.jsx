import ReactDOMServer from 'react-dom/server'
import React, { Component } from 'react'
import ReactTooltip from 'react-tooltip'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { formatRoute } from 'react-router-named-routes'
import { get } from 'lodash'
import { all } from 'redux-saga/effects'
import {
  cacheCall,
  cacheCallValue,
  cacheCallValueInt,
  contractByName,
  withSaga
} from 'saga-genesis'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { isBlank } from '~/utils/isBlank'
import * as routes from '~/../config/routes'
import { Web3ActionButton } from '~/components/Web3ActionButton'

function mapStateToProps(state, { applicationId }) {
  let applicationRowObject = {}

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const address = get(state, 'sagaGenesis.accounts[0]')

  const createdAt = cacheCallValueInt(state, coordinationGameAddress, 'createdAt', applicationId)
  const updatedAt = cacheCallValueInt(state, coordinationGameAddress, 'updatedAt', applicationId)
  const applicantRevealTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'applicantRevealTimeoutInSeconds')
  const verifierTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'verifierTimeoutInSeconds')
  const verifierSubmittedAt = cacheCallValueInt(state, coordinationGameAddress, 'verifierSubmittedAt', applicationId)
  const verifierChallengedAt = cacheCallValueInt(state, coordinationGameAddress, 'verifierChallengedAt', applicationId)

  const verifiersSecret = cacheCallValue(state, coordinationGameAddress, 'verifierSecrets', applicationId)
  const applicantsSecret = cacheCallValue(state, coordinationGameAddress, 'applicantSecrets', applicationId)

  applicationRowObject = {
    applicationId,
    createdAt,
    updatedAt,
    verifiersSecret,
    verifierChallengedAt
  }

  applicationRowObject.applicantRevealExpiresAt      = verifierSubmittedAt + applicantRevealTimeoutInSeconds
  applicationRowObject.verifierSubmitSecretExpiresAt = updatedAt + verifierTimeoutInSeconds

  return {
    applicationRowObject,
    applicantsSecret,
    address,
    coordinationGameAddress,
    latestBlockTimestamp,
    verifiersSecret
  }
}

function* verifierApplicationRowSaga({ coordinationGameAddress, applicationId }) {
  if (!coordinationGameAddress || !applicationId) { return }

  yield all([
    cacheCall(coordinationGameAddress, 'verifierChallengedAt', applicationId),
    cacheCall(coordinationGameAddress, 'verifierSubmittedAt', applicationId),
    cacheCall(coordinationGameAddress, 'createdAt', applicationId),
    cacheCall(coordinationGameAddress, 'updatedAt', applicationId),
    cacheCall(coordinationGameAddress, 'verifierSecrets', applicationId),
    cacheCall(coordinationGameAddress, 'applicantSecrets', applicationId),
    cacheCall(coordinationGameAddress, 'applicantRevealTimeoutInSeconds'),
    cacheCall(coordinationGameAddress, 'verifierTimeoutInSeconds')
  ])
}

export const VerifierApplicationRow = connect(mapStateToProps)(
  withSaga(verifierApplicationRowSaga)(
    class _VerifierApplicationRow extends Component {

      static propTypes = {
        applicationId: PropTypes.number
      }

      render () {
        let expirationMessage,
          verifyAction

        const {
          applicationRowObject,
          applicantsSecret,
          latestBlockTimestamp,
          verifiersSecret
        } = this.props

        let {
          applicantRevealExpiresAt,
          applicationId,
          verifierChallengedAt,
          createdAt,
          verifierSubmitSecretExpiresAt,
          updatedAt
        } = applicationRowObject

        const updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={``} />
        const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
        const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

        const loadingOrUpdatedAtTimestamp = updatedAtDisplay

        const applicantRevealedSecret = !isBlank(applicantsSecret)
        const verifierSubmittedSecret = !isBlank(verifiersSecret)
        const applicantWon = (applicantsSecret === verifiersSecret)

        if (applicantRevealedSecret) {
          expirationMessage = (
            <React.Fragment>
              Application Complete
              <br /><strong>{applicantWon ? `Applicant Won!` : `Applicant Lost`}</strong>
            </React.Fragment>
          )
        } else if (!verifierSubmittedSecret && (latestBlockTimestamp > verifierSubmitSecretExpiresAt)) {
          expirationMessage = <span className="has-text-grey">You missed the deadline to verify this</span>
        } else if (!verifierSubmittedSecret) {
          expirationMessage = (
            <React.Fragment>
              <span className="has-text-grey">Verification required before:</span>
              <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={verifierSubmitSecretExpiresAt} />
            </React.Fragment>
          )

          verifyAction = (
            <Link
              to={formatRoute(routes.VERIFY_APPLICATION, { applicationId })}
              className="button is-small has-text-warning is-outlined is-pulled-right"
            >
              Verify
            </Link>
          )
        } else if (verifierSubmittedSecret) {
          if (latestBlockTimestamp > applicantRevealExpiresAt) {
            if (verifierChallengedAt === 0) {
              expirationMessage = (
                <React.Fragment>
                  <span className="has-text-grey">Applicant failed to reveal secret</span>
                </React.Fragment>
              )
              verifyAction = (
                <Web3ActionButton
                  contractAddress={this.props.coordinationGameAddress}
                  isSmall={true}
                  method='verifierChallenge'
                  args={[applicationId]}
                  buttonText='Challenge'
                  loadingText='Challenging' />
              )
            } else {
              expirationMessage = (
                <React.Fragment>
                  <span className="has-text-grey">You successfully challenged the application</span>
                </React.Fragment>
              )
            }
          } else {
            expirationMessage = (
              <React.Fragment>
                <span className="has-text-grey">Waiting on applicant to reveal secret before:</span>
                <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={applicantRevealExpiresAt} />
              </React.Fragment>
            )
          }
        }

        // necessary to show the verifier on 1st-time component load
        ReactTooltip.rebuild()

        return (
          <div className={classnames(
            'list--item',
          )}>
            <span className="list--item__id">
              #{applicationId}
            </span>

            <span className="list--item__date">
              <abbr data-for='date-tooltip' data-tip={`Created: ${ReactDOMServer.renderToStaticMarkup(createdAtTooltip)}
                  ${ReactDOMServer.renderToStaticMarkup(<br/>)}
                  Last Updated: ${ReactDOMServer.renderToStaticMarkup(updatedAtTooltip)}`}>
                <ReactTooltip
                  id='date-tooltip'
                  html={true}
                  effect='solid'
                  place={'top'}
                  wrapper='span'
                />
                {loadingOrUpdatedAtTimestamp}
              </abbr>
            </span>

            <span className='list--item__status'>
              {expirationMessage}
            </span>

            <span className="list--item__view">
              {verifyAction}
            </span>
          </div>
        )
      }
    }
  )
)
