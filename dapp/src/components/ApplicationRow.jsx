import ReactDOMServer from 'react-dom/server'
import React, { Component } from 'react'
import { Link } from 'react-router-dom'
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
  addContract,
  cacheCall
} from 'saga-genesis'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronCircleRight } from '@fortawesome/free-solid-svg-icons'

import { EthAddress } from '~/components/EthAddress'
import { LoadingLines } from '~/components/LoadingLines'
// import { HippoTimestamp } from '~/components/HippoTimestamp'
import { defined } from '~/utils/defined'
import { get } from 'lodash'

function mapStateToProps(state, { applicationRowObject, applicationId, objIndex }) {
  let status, createdAt, updatedAt, secondsInADay
  let applicationIsStale = false
  if (applicationRowObject === undefined) { applicationRowObject = {} }

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  // const ApplicationScheduleManager = contractByName(state, 'ApplicationScheduleManager')

  // const transactions = Object.values(state.sagaGenesis.transactions)
  const address = get(state, 'sagaGenesis.accounts[0]')

  if (applicationId) {
    // status = cacheCallValueInt(state, applicationId, 'status')
    // createdAt = cacheCallValueInt(state, ApplicationScheduleManager, 'createdAt', applicationId)
    // updatedAt = cacheCallValueInt(state, ApplicationScheduleManager, 'updatedAt', applicationId)
    // secondsInADay = cacheCallValueInt(state, ApplicationScheduleManager, 'secondsInADay')

    const verifier = cacheCallValue(state, coordinationGameAddress, 'verifiers', applicationId)
    console.log('verifier', verifier)

    if (!objIndex) {
      objIndex = applicationId
    }


    // if (status && objIndex) {
      applicationRowObject = {
        applicationId,
        verifier
        // status,
        // createdAt,
        // updatedAt,
        // objIndex,
      }
    // }
  }

  // applicationRowObject['statusLabel'] = applicationStatusToName(applicationRowObject, context)
  // applicationRowObject['statusClass'] = applicationStatusToClass(applicationRowObject, context)

  // if (applicationStale(updatedAt, status, context, secondsInADay, latestBlockTimestamp)) {
  //   applicationIsStale = true
  // }

  // If this applicationRowObject has an ongoing blockchain transaction this will update
  // const reversedTransactions = transactions.reverse().filter(transaction => {
  //   const { call, confirmed, error } = transaction
  //   const applicationId = get(transaction, 'call.args[0]')
  //
  //   return (
  //     call
  //     && (
  //       (!confirmed && !error)
  //       || (error && transactionErrorToCode(error) !== 'userRevert')
  //     )
  //     && (applicationRowObject.applicationId === applicationId)
  //   )
  // })

  // for (let i = 0; i < reversedTransactions.length; i++) {
  //   const applicationId = get(reversedTransactions[i], 'call.args[0]')
  //
  //   if (applicationRowObject.applicationId === applicationId) {
  //     applicationRowObject = updatePendingTx(applicationRowObject, reversedTransactions[i])
  //     break
  //   }
  // }

  return {
    // ApplicationScheduleManager,
    coordinationGameAddress,
    applicationRowObject,
    address,
    // applicationIsStale
  }
}

function* applicationRowSaga({ coordinationGameAddress, applicationId }) {
// function* applicationRowSaga({ coordinationGameAddress, ApplicationScheduleManager, applicationId }) {
  if (!coordinationGameAddress || !applicationId) { return }
  // if (!ApplicationScheduleManager || !coordinationGameAddress || !applicationId) { return }

  yield all([
    cacheCall(coordinationGameAddress, 'verifiers', applicationId)
    // cacheCall(applicationId, 'status'),
    // cacheCall(ApplicationScheduleManager, 'secondsInADay'),
    // cacheCall(ApplicationScheduleManager, 'createdAt', applicationId),
    // cacheCall(ApplicationScheduleManager, 'updatedAt', applicationId)
  ])
}

function mapDispatchToProps (dispatch) {
  return {
    dispatchSend: (transactionId, call, options, address) => {
      dispatch({ type: 'SEND_TRANSACTION', transactionId, call, options, address })
    },
    dispatchRemove: (transactionId) => {
      dispatch({ type: 'REMOVE_TRANSACTION', transactionId })
    }
  }
}

export const ApplicationRow = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(applicationRowSaga)(
    class _ApplicationRow extends Component {

      static propTypes = {
        applicationId: PropTypes.number
      }

      // applicationRowLabel = (applicationRowObject, pendingTransaction) => {
      //   let label = 'Pending'
      //   const { statusLabel, error, receipt, call } = applicationRowObject
      //
      //   if (pendingTransaction && call) {
      //     const { method } = call
      //
      //     if (error) {
      //       label = txErrorMessage(error)
      //     } else if (method === 'diagnoseApplication' || method === 'diagnoseChallengedApplication') {
      //       label = 'Submitting Diagnosis'
      //     } else if (method === 'acceptDiagnosis' || method === 'acceptAsDoctor') {
      //       label = 'Accepting Diagnosis'
      //     } else if (method === 'challengeWithDoctor') {
      //       label = 'Getting Second Opinion'
      //     }
      //
      //     if (receipt) {
      //       label += ' - Confirming'
      //     }
      //   } else {
      //     label = statusLabel
      //   }
      //
      //   return label
      // }
      //
      // applicationRowLabelClass = (applicationRowObject) => {
      //   let labelClass = 'default'
      //   const { error, receipt, statusClass } = applicationRowObject
      //
      //   if (error) {
      //     labelClass = 'danger'
      //   } else if (receipt) {
      //     labelClass = 'warning'
      //   } else if (statusClass) {
      //     labelClass = statusClass
      //   }
      //
      //   return labelClass
      // }
      //
      // applicationRowAction(applicationRowObject, pendingTransaction) {
      //   const { applicationId, error, call, options, gasUsed, transactionId } = applicationRowObject
      //
      //   let action = (
      //     <React.Fragment>
      //       <LoadingLines visible={true} color="#aaaaaa" />
      //     </React.Fragment>
      //   )
      //
      //   if (pendingTransaction) {
      //     if (error) {
      //       if (gasUsed) {
      //         options['gas'] = parseInt(1.2 * gasUsed, 10)
      //       }
      //
      //       action = (
      //         <button
      //           className="btn btn-danger btn-xs"
      //           onClick={(e) => {
      //             e.preventDefault()
      //             this.props.dispatchSend(transactionId, call, options, applicationId)
      //           }}
      //         >
      //           Retry
      //         </button>
      //       )
      //     }
      //   } else {
      //     action = (
      //       <React.Fragment>
      //         <span className="list--item__view__text">View Application&nbsp;</span>
      //         <FontAwesomeIcon
      //           icon={faChevronCircleRight} />
      //       </React.Fragment>
      //     )
      //   }
      //
      //   return action
      // }

      render () {
        const {
          applicationRowObject,
          /*applicationIsStale,*/
        } = this.props

        let remove, label
        let style = { zIndex: 950 }

        let { applicationId, objIndex, verifier } = applicationRowObject

        // let { applicationId, objIndex, error, transactionId, createdAt, updatedAt } = applicationRowObject
        //
        // const pendingTransaction = (
        //      !defined(applicationRowObject.status)
        //   || (applicationRowObject.status === applicationStatus('Pending'))
        // )
        //
        // const createdAtDisplay = <HippoTimestamp timeInUtcSecondsSinceEpoch={createdAt} delimiter={`<br />`} />
        // const loadingOrCreatedAtTimestamp = pendingTransaction ? '...' : createdAtDisplay
        //
        // const createdAtTooltip = <HippoTimestamp timeInUtcSecondsSinceEpoch={createdAt} />
        // const updatedAtTooltip = <HippoTimestamp timeInUtcSecondsSinceEpoch={updatedAt} />
        //
        // if (objIndex) {
        //   style = { zIndex: 901 + objIndex }
        // }
        // const path = this.props.path || routes.PATIENTS_CASES
        // const ethAddress = applicationId ? <EthAddress address={applicationId} onlyAddress={true} /> : null
        //
        // const action = this.applicationRowAction(applicationRowObject, pendingTransaction)
        //
        // if (applicationIsStale && context === 'patient') {
        //   applicationRowObject['statusLabel'] = 'Requires Attention'
        //   applicationRowObject['statusClass'] = 'warning'
        // }
        //
        // const labelClass = this.applicationRowLabelClass(applicationRowObject)
        // label = (
        //   <label className={`label label-${labelClass}`}>
        //     {this.applicationRowLabel(applicationRowObject, pendingTransaction)}
        //   </label>
        // )
        //
        // if (
        //   applicationRowObject.status !== applicationStatus('Pending')
        //   && applicationRowObject.isFirstDoc
        //   && applicationIsStale
        // ) {
        //   label = <AbandonedApplicationActionsContainer applicationId={applicationId} />
        // }
        //
        // if (error) {
        //   remove = (
        //     <button
        //       className="btn-link text-gray btn__remove-transaction"
        //       onClick={(e) => {
        //         e.preventDefault()
        //         this.props.dispatchRemove(transactionId)
        //       }}
        //     >
        //       {'\u2716'}
        //     </button>
        //   )
        // }

        label = applicationId

        return (
          <div className={classnames(
            'list--item',
            /*,
            { 'list--item__pending': pendingTransaction }
          */)}>
            <span className="list--item__application-date text-center">
              {/*
                <span data-tip={`Created: ${ReactDOMServer.renderToStaticMarkup(createdAtTooltip)}
                    ${ReactDOMServer.renderToStaticMarkup(<br/>)}
                    Last Updated: ${ReactDOMServer.renderToStaticMarkup(updatedAtTooltip)}`}>
                  <ReactTooltip
                    html={true}
                    effect='solid'
                    place={'top'}
                    wrapper='span'
                  />
                  {loadingOrCreatedAtTimestamp}
                </span>
              */}
            </span>

            <span className="list--item__status text-center">
              {label}
            </span>

            <span className="list--item__eth-address text text-left">
              {verifier}
            </span>

            <span className="list--item__view text-center">
              {/*{action} {remove}*/}
            </span>
          </div>
        )
      }
    }
  )
)
