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
import { applicationSaga } from '~/sagas/applicationSaga'
import { applicationService } from '~/services/applicationService'
import { mapApplicationState } from '~/services/mapApplicationState'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { applicationId }) {
  let applicationObject = {}

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const address = get(state, 'sagaGenesis.accounts[0]')

  applicationObject = applicationService(state, applicationId, coordinationGameAddress)

  return {
    applicationObject,
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
        let action

        const {
          address,
          applicationObject,
          latestBlockTimestamp
        } = this.props

        let {
          applicationId,
          createdAt,
          updatedAt
        } = applicationObject

        const applicationState = mapApplicationState(address, applicationObject, latestBlockTimestamp)

        // until we remove the index from the array completely
        if (applicationState.isComplete) {
          return null
        }

        const updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={``} />
        const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
        const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

        const loadingOrUpdatedAtTimestamp = updatedAtDisplay

        if (applicationState.canVerify) {
          action = (
            <button
              className="button is-small is-warning is-outlined is-pulled-right"
            >
              Verify
            </button>
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

        const needsAttention = applicationState.canVerify
        const ofInterest = applicationState.canChallenge

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
            view={action}
            needsAttention={needsAttention}
            ofInterest={ofInterest && !needsAttention}
          />
        )
      }
    }
  )
)
