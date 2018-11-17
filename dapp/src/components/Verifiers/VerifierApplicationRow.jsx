import ReactDOMServer from 'react-dom/server'
import React, { PureComponent } from 'react'
import ReactTooltip from 'react-tooltip'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { formatRoute } from 'react-router-named-routes'
import { get } from 'lodash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronUp } from '@fortawesome/free-solid-svg-icons'
import {
  contractByName,
  withSaga
} from 'saga-genesis'
import { AppId } from '~/components/AppId'
import { ApplicationStatus } from '~/components/Applications/ApplicationStatus'
import { ApplicationListPresenter } from '~/components/Applications/ApplicationListPresenter'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { applicationSaga } from '~/sagas/applicationSaga'
import { applicationService } from '~/services/applicationService'
import { isBlank } from '~/utils/isBlank'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { applicationId }) {
  let applicationRowObject = {}

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const address = get(state, 'sagaGenesis.accounts[0]')

  applicationRowObject = applicationService(state, applicationId, coordinationGameAddress)

  return {
    applicationRowObject,
    address,
    coordinationGameAddress,
    latestBlockTimestamp
  }
}

export const VerifierApplicationRow = connect(mapStateToProps)(
  withSaga(applicationSaga)(
    class _VerifierApplicationRow extends PureComponent {

      static propTypes = {
        applicationId: PropTypes.string
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

        const canVerify = (
          applicantRevealedSecret &&
          !verifierSubmittedSecret &&
          isBlank(whistleblower) &&
          (latestBlockTimestamp < verifierSubmitSecretExpiresAt) &&
          verifierChallengedAt === 0
        )

        if (canVerify) {
          verifyAction = (
            <button
              className="button is-small is-warning is-outlined is-pulled-right"
            >
              Verify
            </button>
          )
        } else if ( // also why can't we verify OR challenge at the same time?
          verifierSubmittedSecret &&
          isBlank(whistleblower) &&
          // latestBlockTimestamp > applicantRevealExpiresAt && // why do we need to wait until the applicant reveal expires?
          verifierChallengedAt === 0
        ) {
          verifyAction = (
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
            {loadingOrUpdatedAtTimestamp}
          </abbr>
        )

        const needsAttention = canVerify

        // necessary to show the verifier on 1st-time component load
        ReactTooltip.rebuild()

        return (
          <ApplicationListPresenter
            linkTo={formatRoute(routes.VERIFY_APPLICATION, { applicationId })}
            id={(
              <React.Fragment>
                <FontAwesomeIcon icon={faChevronUp} className="list--icon" />
                <AppId applicationId={applicationId} />
              </React.Fragment>
            )}
            date={date}
            status={<ApplicationStatus applicationId={applicationId} />}
            view={verifyAction}
            needsAttention={needsAttention}
          />
        )
      }
    }
  )
)
