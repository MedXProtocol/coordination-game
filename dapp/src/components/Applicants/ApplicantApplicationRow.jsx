import ReactDOMServer from 'react-dom/server'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import ReactTooltip from 'react-tooltip'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { all } from 'redux-saga/effects'
import BN from 'bn.js'
import {
  withSaga,
  cacheCallValue,
  cacheCallValueInt,
  contractByName,
  cacheCall
} from 'saga-genesis'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faChevronCircleRight } from '@fortawesome/free-solid-svg-icons'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { storageAvailable } from '~/services/storageAvailable'
import { applicationStorageKey } from '~/utils/applicationStorageKey'
import { isBlank } from '~/utils/isBlank'
import { getWeb3 } from '~/utils/getWeb3'
import { get } from 'lodash'

function mapStateToProps(state, { applicationId }) {
  let applicantRevealTimeoutInDays,
    applicationRowObject,
    hint,
    secondsInADay,
    verifierTimeoutInDays

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const networkId = get(state, 'sagaGenesis.network.networkId')
  const address = get(state, 'sagaGenesis.accounts[0]')

  const createdAt = cacheCallValueInt(state, coordinationGameAddress, 'createdAt', applicationId)
  const updatedAt = cacheCallValueInt(state, coordinationGameAddress, 'updatedAt', applicationId)

  const verifier = cacheCallValue(state, coordinationGameAddress, 'verifiers', applicationId)
  const verifiersSecret = cacheCallValue(state, coordinationGameAddress, 'verifierSecrets', applicationId)

  hint = cacheCallValue(state, coordinationGameAddress, 'hints', applicationId)
  if (hint) {
    hint = getWeb3().utils.hexToAscii(hint)
  }

  applicationRowObject = {
    applicationId,
    createdAt,
    hint,
    verifier,
    verifiersSecret,
    updatedAt
  }

  if (!isBlank(verifier)) {
    secondsInADay = cacheCallValueInt(state, coordinationGameAddress, 'secondsInADay')
    verifierTimeoutInDays = cacheCallValueInt(state, coordinationGameAddress, 'verifierTimeoutInDays')
    applicantRevealTimeoutInDays = cacheCallValueInt(state, coordinationGameAddress, 'applicantRevealTimeoutInDays')
  }

  if (storageAvailable('localStorage')) {
    let applicationObject
    const key = applicationStorageKey(networkId, applicationId)
    const applicationJson = localStorage.getItem(key)

    if (applicationJson) {
      applicationObject = JSON.parse(applicationJson)
      applicationRowObject = {
        ...applicationRowObject,
        random: applicationObject.random,
        secret: applicationObject.secret
      }
    }
  } else {
    console.warn('Unable to read from localStorage')
  }

  applicationRowObject.verifierSubmitSecretExpiresAt = updatedAt + (secondsInADay * verifierTimeoutInDays)
  applicationRowObject.applicantRevealExpiresAt      = updatedAt + (secondsInADay * applicantRevealTimeoutInDays)
  // console.log('Current time: ', latestBlockTimestamp)
  // console.log('verifierSubmitSecretExpires at: ', applicationRowObject.verifierSubmitSecretExpiresAt)
  // console.log('verifierSubmitSecretExpires in: ', (applicationRowObject.verifierSubmitSecretExpiresAt - latestBlockTimestamp))
  // console.log('applicantRevealExpires at: ', applicationRowObject.applicantRevealExpiresAt)
  // console.log('applicantRevealExpires in: ', (applicationRowObject.applicantRevealExpiresAt - latestBlockTimestamp))
  //
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
    applicationRowObject,
    address,
    coordinationGameAddress,
    latestBlockTimestamp
  }
}

function* applicantApplicationRowSaga({ coordinationGameAddress, applicationId }) {
  if (!coordinationGameAddress || !applicationId) { return }

  yield all([
    cacheCall(coordinationGameAddress, 'verifiers', applicationId),
    cacheCall(coordinationGameAddress, 'hints', applicationId),
    cacheCall(coordinationGameAddress, 'createdAt', applicationId),
    cacheCall(coordinationGameAddress, 'updatedAt', applicationId),
    cacheCall(coordinationGameAddress, 'verifierSecrets', applicationId),
    cacheCall(coordinationGameAddress, 'secondsInADay'),
    cacheCall(coordinationGameAddress, 'applicantRevealTimeoutInDays'),
    cacheCall(coordinationGameAddress, 'verifierTimeoutInDays')
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

export const ApplicantApplicationRow = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(applicantApplicationRowSaga)(
    class _ApplicantApplicationRow extends Component {

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
        let expirationMessage,
          hintRandomAndExport

        const {
          applicationRowObject,
          latestBlockTimestamp
        } = this.props

        let {
          applicantRevealExpiresAt,
          applicationId,
          createdAt,
          hint,
          random,
          secret,
          updatedAt,
          verifier,
          verifiersSecret,
          verifierSubmitSecretExpiresAt
        } = applicationRowObject

        // let { error, transactionId } = applicationRowObject

        // const pendingTransaction = (
        //      !defined(applicationRowObject.status)
        //   || (applicationRowObject.status === applicationStatus('Pending'))
        // )

        const createdAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} delimiter={``} />
        const loadingOrCreatedAtTimestamp = createdAtDisplay
        // const loadingOrCreatedAtTimestamp = pendingTransaction ? '...' : createdAtDisplay

        const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
        const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

        const verifierSubmittedSecret = !isBlank(verifiersSecret)

        if (!isBlank(verifier) && !verifierSubmittedSecret) {
          expirationMessage = (
            <React.Fragment>
              <span className="has-text-grey">Waiting on Verifier until:</span>
              <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={verifierSubmitSecretExpiresAt} />
            </React.Fragment>
          )
        } else if (verifierSubmittedSecret) {
          let secretAsHex
          if (secret) {
            secretAsHex = getWeb3().utils.sha3(secret.toString())
          }

          expirationMessage = (
            <React.Fragment>
              <span className="has-text-grey">Reveal your secret before:</span>
              <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={applicantRevealExpiresAt} />
              <br />
                <Web3ActionButton
                  contractAddress={this.props.coordinationGameAddress}
                  method='applicantRevealSecret'
                  args={[applicationId, secretAsHex, new BN(random)]}
                  buttonText='Reveal Secret'
                  confirmationMessage='"Reveal Secret" transaction confirmed.'
                  txHashMessage='"Reveal Secret" transaction sent successfully -
                    it will take a few minutes to confirm on the Ethereum network.'/>
            </React.Fragment>
          )
        }

        if (!isBlank(verifier) && (latestBlockTimestamp > verifierSubmitSecretExpiresAt)) {
          expirationMessage = <span className="has-text-warning">Verifier Failed to Respond</span>
        } else if (verifierSubmittedSecret && (latestBlockTimestamp > applicantRevealExpiresAt)) {
          expirationMessage = <span className="has-text-warning">Reveal Secret Expired</span>
        }

        hintRandomAndExport = (
          <React.Fragment>
            Hint: {hint}
            <br />Random: {random}
          </React.Fragment>
        )
        // uint256 _applicationId,
        // bytes32 _secret,
        // uint256 _randomNumber
        return (
          <div className={classnames(
            'list--item',
            /*,
            { 'list--item__pending': pendingTransaction }
          */)}>
            <span className="list--item__id text-center">
              #{applicationId}
            </span>

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
                {loadingOrCreatedAtTimestamp}
              </span>
            </span>

            <span className="list--item__status text-center">
              {hintRandomAndExport}
            </span>

            <span className="list--item__view text-center">
              {isBlank(verifier)
                ? (
                    <Web3ActionButton
                      contractAddress={this.props.coordinationGameAddress}
                      method='applicantRandomlySelectVerifier'
                      args={[applicationId]}
                      buttonText='Request Verification'
                      confirmationMessage='Verification request confirmed.'
                      txHashMessage='Verification request sent successfully -
                        it will take a few minutes to confirm on the Ethereum network.'/>
                  )
                : expirationMessage
              }
            </span>
          </div>
        )
      }
    }
  )
)
