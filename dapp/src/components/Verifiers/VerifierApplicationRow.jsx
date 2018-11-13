import ReactDOMServer from 'react-dom/server'
import React, { Component } from 'react'
import ReactTooltip from 'react-tooltip'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { formatRoute } from 'react-router-named-routes'
import { get } from 'lodash'
import {
  contractByName,
  withSaga
} from 'saga-genesis'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { verifierApplicationService } from '~/services/verifierApplicationService'
import { verifierApplicationSaga } from '~/sagas/verifierApplicationSaga'
import { isBlank } from '~/utils/isBlank'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { applicationId }) {
  let applicationRowObject = {}

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const address = get(state, 'sagaGenesis.accounts[0]')

  applicationRowObject = verifierApplicationService(state, applicationId, coordinationGameAddress)

  return {
    applicationRowObject,
    address,
    coordinationGameAddress,
    latestBlockTimestamp
  }
}

export const VerifierApplicationRow = connect(mapStateToProps)(
  withSaga(verifierApplicationSaga)(
    class _VerifierApplicationRow extends Component {

      static propTypes = {
        applicationId: PropTypes.number
      }

      render () {
        let expirationMessage,
          verifyAction

        const {
          applicationRowObject,
          latestBlockTimestamp
        } = this.props

        let {
          applicantRevealExpiresAt,
          applicationId,
          applicantsSecret,
          verifierChallengedAt,
          createdAt,
          verifierSubmitSecretExpiresAt,
          verifiersSecret,
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
              className="button is-small is-warning is-outlined is-pulled-right"
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
