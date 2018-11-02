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
  withSaga,
  cacheCallValueInt,
  contractByName,
  cacheCall
} from 'saga-genesis'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { applicationId }) {
  let createdAt,
    updatedAt,
    secondsInADay,
    verifierTimeoutInDays

  let applicationRowObject = {}

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const address = get(state, 'sagaGenesis.accounts[0]')

  if (applicationId) {
    createdAt = cacheCallValueInt(state, coordinationGameAddress, 'createdAt', applicationId)
    updatedAt = cacheCallValueInt(state, coordinationGameAddress, 'updatedAt', applicationId)
    secondsInADay = cacheCallValueInt(state, coordinationGameAddress, 'secondsInADay')
    verifierTimeoutInDays = cacheCallValueInt(state, coordinationGameAddress, 'verifierTimeoutInDays')

    applicationRowObject = {
      applicationId,
      createdAt,
      updatedAt
    }
  }

  applicationRowObject.expiresAt = updatedAt + (secondsInADay * verifierTimeoutInDays)
  console.log('Current time: ', latestBlockTimestamp)
  console.log('Expires at: ', applicationRowObject.expiresAt)
  console.log('Expires in: ', (applicationRowObject.expiresAt - latestBlockTimestamp))

  return {
    coordinationGameAddress,
    applicationRowObject,
    address
  }
}

function* verifierApplicationRowSaga({ coordinationGameAddress, applicationId }) {
  if (!coordinationGameAddress || !applicationId) { return }

  yield all([
    cacheCall(coordinationGameAddress, 'createdAt', applicationId),
    cacheCall(coordinationGameAddress, 'updatedAt', applicationId),
    cacheCall(coordinationGameAddress, 'secondsInADay'),
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
        const {
          applicationRowObject
        } = this.props

        let expired
        let {
          applicationId,
          createdAt,
          expiresAt,
          latestBlockTimestamp,
          updatedAt
        } = applicationRowObject

        const updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={``} />

        const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
        const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

        const loadingOrUpdatedAtTimestamp = updatedAtDisplay

        if (latestBlockTimestamp > expiresAt) {
          expired = true
        }

        return (
          <div className={classnames(
            'list--item',
          )}>
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

            <span className="list--item__status text-center">
              Application #{applicationId}
            </span>

            <span className='list--item__status text-center'>
              {
                expired
                  ?
                    (
                      <span className="has-text-warning">Verification Expired</span>
                    )
                  : (
                    <React.Fragment>
                      <span className="has-text-grey">Verification required before:</span>
                      <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={expiresAt} />
                    </React.Fragment>
                  )
              }
            </span>

            <span className="list--item__view text-right">
              {
                expired
                  ?
                    (
                      null
                    )
                  : (
                    <Link
                      to={formatRoute(routes.VERIFY_APPLICATION, { applicationId })}
                      className="button is-small is-warning is-outlined is-pulled-right"
                    >
                      Verify
                    </Link>
                  )
              }
            </span>
          </div>
        )
      }
    }
  )
)
