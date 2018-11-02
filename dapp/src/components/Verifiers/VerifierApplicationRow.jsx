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

function mapStateToProps(state, { applicationId }) {
  let applicationRowObject = {}

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const address = get(state, 'sagaGenesis.accounts[0]')

  const createdAt = cacheCallValueInt(state, coordinationGameAddress, 'createdAt', applicationId)
  const updatedAt = cacheCallValueInt(state, coordinationGameAddress, 'updatedAt', applicationId)
  const secondsInADay = cacheCallValueInt(state, coordinationGameAddress, 'secondsInADay')
  const applicantRevealTimeoutInDays = cacheCallValueInt(state, coordinationGameAddress, 'applicantRevealTimeoutInDays')
  const verifierTimeoutInDays = cacheCallValueInt(state, coordinationGameAddress, 'verifierTimeoutInDays')
  const verifiersSecret = cacheCallValue(state, coordinationGameAddress, 'verifierSecrets', applicationId)

  applicationRowObject = {
    applicationId,
    createdAt,
    updatedAt
  }

  applicationRowObject.verifierSubmitSecretExpiresAt = updatedAt + (secondsInADay * verifierTimeoutInDays)
  applicationRowObject.applicantRevealExpiresAt    = updatedAt + (secondsInADay * applicantRevealTimeoutInDays)
  // console.log('Current time: ', latestBlockTimestamp)
  // console.log('Expires at: ', applicationRowObject.verifierSubmitSecretExpiresAt)
  // console.log('Expires in: ', (applicationRowObject.verifierSubmitSecretExpiresAt - latestBlockTimestamp))

  return {
    applicationRowObject,
    address,
    coordinationGameAddress,
    latestBlockTimestamp,
    verifiersSecret
  }
}

function* verifierApplicationRowSaga({ coordinationGameAddress, applicationId }) {
  if (!coordinationGameAddress || !applicationId) { return }

  yield all([
    cacheCall(coordinationGameAddress, 'createdAt', applicationId),
    cacheCall(coordinationGameAddress, 'updatedAt', applicationId),
    cacheCall(coordinationGameAddress, 'verifierSecrets', applicationId),
    cacheCall(coordinationGameAddress, 'secondsInADay'),
    cacheCall(coordinationGameAddress, 'applicantRevealTimeoutInDays'),
    cacheCall(coordinationGameAddress, 'verifierTimeoutInDays')
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
          latestBlockTimestamp,
          verifiersSecret
        } = this.props

        let {
          applicantRevealExpiresAt,
          applicationId,
          createdAt,
          verifierSubmitSecretExpiresAt,
          updatedAt
        } = applicationRowObject

        const updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={``} />

        const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
        const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

        const loadingOrUpdatedAtTimestamp = updatedAtDisplay

        const verifierSubmittedSecret = !isBlank(verifiersSecret)

        if (!verifierSubmittedSecret && (latestBlockTimestamp > verifierSubmitSecretExpiresAt)) {
          expirationMessage = <span className="has-text-warning">Cannot Verify, Verification Expiry Passed</span>
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
              className="button is-small is-warning is-outlined is-pulled-right"
            >
              Verify
            </Link>
          )
        } else if (verifierSubmittedSecret) {
          expirationMessage = (
            <React.Fragment>
              <span className="has-text-grey">Waiting on applicant to reveal secret before:</span>
              <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={applicantRevealExpiresAt} />
            </React.Fragment>
          )
        }

        return (
          <div className={classnames(
            'list--item',
          )}>
            <span className="list--item__id text-center">
              #{applicationId}
            </span>

            <span className="list--item__date text-center">
              <span data-tip={`Created: ${ReactDOMServer.renderToStaticMarkup(createdAtTooltip)}
                  ${ReactDOMServer.renderToStaticMarkup(<br/>)}
                  Last Updated: ${ReactDOMServer.renderToStaticMarkup(updatedAtTooltip)}`}>
                <ReactTooltip
                  html={true}
                  effect='solid'
                  place={'top'}
                  wrapper='span'
                />
                {loadingOrUpdatedAtTimestamp}
              </span>
            </span>

            <span className='list--item__status text-center'>
              {expirationMessage}
            </span>

            <span className="list--item__view text-right">
              {verifyAction}
            </span>
          </div>
        )
      }
    }
  )
)
