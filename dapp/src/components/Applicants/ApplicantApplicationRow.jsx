import ReactDOMServer from 'react-dom/server'
import React, { Component } from 'react'
import ReactTooltip from 'react-tooltip'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { formatRoute } from 'react-router-named-routes'
import {
  withSaga,
  contractByName
} from 'saga-genesis'
import { get } from 'lodash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { ApplicationListPresenter } from '~/components/Applications/ApplicationListPresenter'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { applicationService } from '~/services/applicationService'
import { mapApplicationState } from '~/services/mapApplicationState'
import { applicationSaga } from '~/sagas/applicationSaga'
import * as routes from '~/../config/routes'
import { AppId } from '~/components/AppId'

function mapStateToProps(state, { applicationId }) {
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')

  const applicationObject = applicationService(state, applicationId, coordinationGameAddress)

  return {
    applicationObject,
    coordinationGameAddress,
    latestBlockTimestamp
  }
}

function mapDispatchToProps (dispatch) {
  return {
    dispatchSend: (transactionId, call, options, address) => {
      dispatch({ type: 'SG_SEND_TRANSACTION', transactionId, call, options, address })
    },
    dispatchRemove: (transactionId) => {
      dispatch({ type: 'SG_REMOVE_TRANSACTION', transactionId })
    }
  }
}

export const ApplicantApplicationRow = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(applicationSaga)(
    class _ApplicantApplicationRow extends Component {

      static propTypes = {
        applicationId: PropTypes.string
      }

      render () {
        let hintRandomAndSecret

        const {
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

        const createdAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} delimiter={``} />
        const loadingOrCreatedAtTimestamp = createdAtDisplay

        const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
        const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

        const applicationState = mapApplicationState(address, applicationObject, latestBlockTimestamp)

        if (tokenName && tokenTicker && secret && random) {
          hintRandomAndSecret = (
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
          hintRandomAndSecret = (
            <abbr data-for='hint-random-secret-tooltip' data-tip="We were unable to find the original data for this application as it was probably saved in another Web3 browser. <br/>Please use that browser to reveal your secret.">not available</abbr>
          )
        }

        const date = (
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
            {loadingOrCreatedAtTimestamp}
          </abbr>
        )

        const status = (
          <React.Fragment>
            {hintRandomAndSecret}
            <ReactTooltip
              id='hint-random-secret-tooltip'
              html={true}
              effect='solid'
              place={'top'}
              wrapper='span'
            />
          </React.Fragment>
        )

        const ofInterest = (
          applicationState.waitingOnVerifier
          || applicationState.applicantMissedRevealDeadline
        )
        const needsAttention = (
          applicationState.needsAVerifier
          || applicationState.needsApplicantReveal
          || applicationState.verifierHasChallenged
          || applicationState.needsNewVerifier
        )

        return (
          <ApplicationListPresenter
            linkTo={formatRoute(routes.APPLICATION, { applicationId: this.props.applicationId })}
            id={(
              <React.Fragment>
                <FontAwesomeIcon icon={faChevronUp} className="list--icon" />
                <AppId applicationId={applicationId} />
              </React.Fragment>
            )}
            date={date}
            status={status}
            view={<button className="button is-primary is-small is-outlined">View Submission</button>}
            needsAttention={needsAttention}
            isInfo={ofInterest && !needsAttention}
          />
        )
      }
    }
  )
)
