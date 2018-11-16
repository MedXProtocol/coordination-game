import ReactDOMServer from 'react-dom/server'
import React, { PureComponent } from 'react'
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
import { ApplicationStatus } from './ApplicationStatus'

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
    class _VerifierApplicationRow extends PureComponent {

      static propTypes = {
        applicationId: PropTypes.number
      }

      render () {
        let verifyAction

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
          updatedAt,
          verifiersSecret,
          whistleblower
        } = applicationRowObject

        const updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={``} />
        const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
        const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

        const loadingOrUpdatedAtTimestamp = updatedAtDisplay

        const applicantRevealedSecret = !isBlank(applicantsSecret)
        const verifierSubmittedSecret = !isBlank(verifiersSecret)

        if (
          isBlank(whistleblower) &&
          !applicantRevealedSecret &&
          !verifierSubmittedSecret &&
          (latestBlockTimestamp <= verifierSubmitSecretExpiresAt)
        ) {
          verifyAction = (
            <Link
              to={formatRoute(routes.VERIFY_APPLICATION, { applicationId })}
              className="button is-small is-warning is-outlined is-pulled-right"
            >
              Verify
            </Link>
          )
        } else if (
          verifierSubmittedSecret &&
          isBlank(whistleblower) &&
          latestBlockTimestamp > applicantRevealExpiresAt &&
          verifierChallengedAt === 0
        ) {
          verifyAction = (
            <Web3ActionButton
              contractAddress={this.props.coordinationGameAddress}
              isSmall={true}
              method='verifierChallenge'
              args={[applicationId]}
              buttonText='Challenge'
              loadingText='Challenging'
              confirmationMessage='Challenge transaction confirmed.'
              txHashMessage='"Challenge" transaction sent successfully -
                it will take a few minutes to confirm on the Ethereum network.' />
          )
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
              <ApplicationStatus applicationId={applicationId} />
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
