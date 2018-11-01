import ReactDOMServer from 'react-dom/server'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import ReactTooltip from 'react-tooltip'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { all } from 'redux-saga/effects'
import {
  withSaga,
  cacheCallValue,
  cacheCallValueInt,
  contractByName,
  cacheCall
} from 'saga-genesis'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { getWeb3 } from '~/utils/getWeb3'
import { get } from 'lodash'

function mapStateToProps(state, { applicationId }) {
  let createdAt, updatedAt, hint

  let applicationRowObject = {}

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')

  const address = get(state, 'sagaGenesis.accounts[0]')

  if (applicationId) {
    createdAt = cacheCallValueInt(state, coordinationGameAddress, 'createdAt', applicationId)
    updatedAt = cacheCallValueInt(state, coordinationGameAddress, 'updatedAt', applicationId)

    hint = cacheCallValue(state, coordinationGameAddress, 'hints', applicationId)
    if (hint) {
      hint = getWeb3().utils.hexToAscii(hint)
    }

    applicationRowObject = {
      applicationId,
      createdAt,
      updatedAt,
      hint
    }
  }

  return {
    coordinationGameAddress,
    applicationRowObject,
    address
  }
}

function* verifierApplicationRowSaga({ coordinationGameAddress, applicationId }) {
  if (!coordinationGameAddress || !applicationId) { return }

  yield all([
    cacheCall(coordinationGameAddress, 'hints', applicationId),
    cacheCall(coordinationGameAddress, 'createdAt', applicationId),
    cacheCall(coordinationGameAddress, 'updatedAt', applicationId)
  ])
}

function mapDispatchToProps (dispatch) {
  return {
    dispatchShowVerifyApplication: (applicationId) => {
      dispatch({ type: 'SHOW_VERIFY_APPLICATION', applicationId })
    }
  }
}

export const VerifierApplicationRow = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(verifierApplicationRowSaga)(
    class _VerifierApplicationRow extends Component {

      static propTypes = {
        applicationId: PropTypes.number
      }

      handleVerifyClick = (e) => {
        e.preventDefault()

        this.props.dispatchShowVerifyApplication(this.props.applicationId)
      }

      render () {
        const {
          applicationRowObject
        } = this.props

        let {
          applicationId,
          createdAt,
          updatedAt,
          hint
        } = applicationRowObject

        const updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={``} />

        const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
        const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

        const loadingOrUpdatedAtTimestamp = updatedAtDisplay

        const label = applicationId

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
              Application #{label}
            </span>

            <span className="list--item__status text-center">
              Hint: {hint}
            </span>

            <span className="list--item__view text-right">
              <button
                className="button is-small is-warning is-outlined is-pulled-right"
                onClick={this.handleVerifyClick}
              >
                Verify
              </button>
            </span>
          </div>
        )
      }
    }
  )
)
