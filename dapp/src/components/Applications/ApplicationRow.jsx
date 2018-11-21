import ReactDOMServer from 'react-dom/server'
import React, { PureComponent } from 'react'
import ReactTooltip from 'react-tooltip'
import PropTypes from 'prop-types'
import { formatRoute } from 'react-router-named-routes'
import { get } from 'lodash'
import { connect } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronUp } from '@fortawesome/free-solid-svg-icons'
import {
  withSaga,
  contractByName
} from 'saga-genesis'
import { AppId } from '~/components/AppId'
import { ApplicationListPresenter } from '~/components/Applications/ApplicationListPresenter'
import { ApplicationStatus } from '~/components/Applications/ApplicationStatus'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { applicationService } from '~/services/applicationService'
import { mapApplicationState } from '~/services/mapApplicationState'
import { applicationSaga } from '~/sagas/applicationSaga'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { applicationId }) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')

  const applicationObject = applicationService(state, applicationId, coordinationGameAddress)

  return {
    address,
    applicationObject,
    coordinationGameAddress,
    latestBlockTimestamp
  }
}

export const ApplicationRow = connect(mapStateToProps)(
  withSaga(applicationSaga)(
    class _ApplicationRow extends PureComponent {

      static propTypes = {
        applicationId: PropTypes.string
      }

      render () {
        let ofInterest,
          needsAttention,
          action,
          date,
          status,
          statusText

        let {
          address,
          applicationObject,
          latestBlockTimestamp
        } = this.props

        let {
          applicationId,
          createdAt,
          tokenTicker,
          tokenName,
          random,
          secret,
          updatedAt
        } = applicationObject

        action = (
          <button className="button is-primary is-small is-outlined">View Submission</button>
        )

        // const createdAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} delimiter={``} />
        const updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={``} />
        const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
        const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

        const applicationState = mapApplicationState(address, applicationObject, latestBlockTimestamp)

        /// OBSERVER (defaults, anyone who isn't involved in the application)
        date = (
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
            {updatedAtDisplay}
          </abbr>
        )

        status = <ApplicationStatus applicationId={applicationId} />


        // APPLICANT: Could be a component or function ...
        if (applicationState.isApplicant) {
          if (tokenName && tokenTicker && secret && random) {
            statusText = (
              <React.Fragment>
                Token Name: <strong>{tokenName}</strong>
                <br />
                Token Ticker: <strong>{tokenTicker}</strong>
              </React.Fragment>
            )
            // <br />
            // Secret: <strong>{secret}</strong>
            // <br />
            // Random: <strong>{random.toString()}</strong>
          } else {
            statusText = (
              <abbr
                data-for='hint-random-secret-tooltip'
                data-tip="Could not find data. Possibly saved in another Web3 browser?"
              >
                not available
              </abbr>
            )
          }

          status = (
            <React.Fragment>
              {statusText}
              <ReactTooltip
                id='hint-random-secret-tooltip'
                html={true}
                effect='solid'
                place={'top'}
                wrapper='span'
              />
            </React.Fragment>
          )

          ofInterest = (
            applicationState.waitingOnVerifier
            || applicationState.verifierHasChallenged
          )
          needsAttention = (
            applicationState.needsAVerifier
            || applicationState.needsApplicantReveal
            || applicationState.needsNewVerifier
          )

          if (applicationState.needsApplicantReveal) {
            action = (
              <button className="button is-warning is-small is-outlined">Reveal Your Secret</button>
            )
          }
          if (applicationState.needsNewVerifier) {
            action = (
              <button className="button is-warning is-small is-outlined">Request New Verifier</button>
            )
          }
          if (applicationState.needsAVerifier) {
            action = (
              <button className="button is-warning is-small is-outlined">Request Verification</button>
            )
          }
          if (applicationState.verifierHasChallenged) {
            action = (
              <button className="button is-info is-small is-outlined">Closed</button>
            )
          }
          if (!applicationState.noWhistleblower) {
            action = (
              <button className="button is-danger is-small is-outlined">Whistleblown!</button>
            )
          }
        }

        // VERIFIER: Could be a component or function ...
        if (applicationState.isVerifier) {
          // until we remove the index from the array completely
          if (applicationState.isComplete || applicationState.verifierHasChallenged) {
            return null
          }

          if (applicationState.canVerify) {
            action = (
              <button
                className="button is-small is-warning is-outlined is-pulled-right"
              >
                Verify
              </button>
            )
          }

          needsAttention = applicationState.canVerify
          ofInterest = applicationState.canChallenge
        }


        return (
          <ApplicationListPresenter
            linkTo={formatRoute(routes.APPLICATION, { applicationId })}
            id={(
              <React.Fragment>
                <FontAwesomeIcon icon={faChevronUp} className="list--icon" />
                <AppId applicationId={applicationId} />
              </React.Fragment>
            )}
            date={date}
            status={status}
            view={action}
            needsAttention={needsAttention}
            ofInterest={ofInterest && !needsAttention}
          />
        )
      }
    }
  )
)
