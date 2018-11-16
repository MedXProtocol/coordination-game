import ReactDOMServer from 'react-dom/server'
import React, { Component } from 'react'
import classnames from 'classnames'
import ReactTooltip from 'react-tooltip'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { formatRoute } from 'react-router-named-routes'
import { Link } from 'react-router-dom'
import {
  withSaga,
  contractByName
} from 'saga-genesis'
import { get } from 'lodash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { applicationService } from '~/services/applicationService'
import { applicationSaga } from '~/sagas/applicationSaga'
import { defined } from '~/utils/defined'
import { isBlank } from '~/utils/isBlank'
import * as routes from '~/../config/routes'

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
        applicationId: PropTypes.number
      }

      render () {
        let hintRandomAndSecret

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

        const createdAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} delimiter={``} />
        const loadingOrCreatedAtTimestamp = createdAtDisplay

        const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
        const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

        const verifierSubmittedSecret = !isBlank(verifiersSecret)
        const applicantRevealedSecret = !isBlank(applicantsSecret)
        const applicantWon = (applicantsSecret === verifiersSecret)




        // START DUPLICATE CODE! (put in service?)
        const success = applicantRevealedSecret
        const waitingOnVerifier = (!isBlank(verifier) && !verifierSubmittedSecret)
        const needsApplicantReveal = (verifierSubmittedSecret && defined(random) && defined(secret))

        const verifierHasChallenged = (verifierChallengedAt !== 0)
        const applicantMissedRevealDeadline = (
          verifierSubmittedSecret && (latestBlockTimestamp > applicantRevealExpiresAt)
        )

        const needsNewVerifier = (!isBlank(verifier) && (latestBlockTimestamp > verifierSubmitSecretExpiresAt))
        const needsAVerifier = (isBlank(verifier) && defined(tokenTicker) && defined(tokenName) && defined(secret) && defined(random))
        // END DUPLICATE CODE





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

        // necessary to show the verifier on 1st-time component load
        // ReactTooltip.rebuild()

        const ofInterest = waitingOnVerifier || applicantMissedRevealDeadline
        const needsAttention = needsAVerifier || needsApplicantReveal || verifierHasChallenged || needsNewVerifier

        return (
          <Link
            to={formatRoute(routes.APPLICATION, { applicationId: this.props.applicationId } )}
            className={classnames(
              'list--item',
              {
                'is-warning': needsAttention,
                'is-info': ofInterest && !needsAttention
              }
            )}
          >
            <span className="list--item__id">
              <FontAwesomeIcon icon={faChevronUp} className="list--icon" />
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
                {loadingOrCreatedAtTimestamp}
              </abbr>
            </span>

            <span className="list--item__status">
              {hintRandomAndSecret}
              <ReactTooltip
                id='hint-random-secret-tooltip'
                html={true}
                effect='solid'
                place={'top'}
                wrapper='span'
              />
            </span>

            <span className="list--item__view">
              <button className="button is-primary is-small is-outlined">View Submission</button>
              <ReactTooltip
                id='expiration-message-tooltip'
                html={true}
                effect='solid'
                place={'top'}
                wrapper='span'
              />
            </span>
          </Link>
        )
      }
    }
  )
)
