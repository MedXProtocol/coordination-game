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
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faChevronCircleRight } from '@fortawesome/free-solid-svg-icons'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { Web3ActionButton } from '~/components/Web3ActionButton'
import { retrieveApplicationDetailsFromLocalStorage } from '~/services/retrieveApplicationDetailsFromLocalStorage'
import { isBlank } from '~/utils/isBlank'
import { getWeb3 } from '~/utils/getWeb3'
import { defined } from '~/utils/defined'
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
  const verifierChallengedAt = cacheCallValueInt(state, coordinationGameAddress, 'verifierChallengedAt', applicationId)

  const createdAt = cacheCallValueInt(state, coordinationGameAddress, 'createdAt', applicationId)
  const updatedAt = cacheCallValueInt(state, coordinationGameAddress, 'updatedAt', applicationId)

  const verifier = cacheCallValue(state, coordinationGameAddress, 'verifiers', applicationId)
  const verifiersSecret = cacheCallValue(state, coordinationGameAddress, 'verifierSecrets', applicationId)

  const applicantsSecret = cacheCallValue(state, coordinationGameAddress, 'applicantSecrets', applicationId)

  hint = cacheCallValue(state, coordinationGameAddress, 'hints', applicationId)
  if (hint) {
    hint = getWeb3().utils.hexToAscii(hint)
  }

  applicationRowObject = {
    applicantsSecret,
    applicationId,
    createdAt,
    verifierChallengedAt,
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

  applicationRowObject = retrieveApplicationDetailsFromLocalStorage(
    applicationRowObject,
    networkId,
    address,
    createdAt
  )

  applicationRowObject.verifierSubmitSecretExpiresAt = updatedAt + (secondsInADay * verifierTimeoutInDays)
  applicationRowObject.applicantRevealExpiresAt      = updatedAt + (secondsInADay * applicantRevealTimeoutInDays)

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
    cacheCall(coordinationGameAddress, 'verifierChallengedAt', applicationId),
    cacheCall(coordinationGameAddress, 'verifiers', applicationId),
    cacheCall(coordinationGameAddress, 'hints', applicationId),
    cacheCall(coordinationGameAddress, 'createdAt', applicationId),
    cacheCall(coordinationGameAddress, 'updatedAt', applicationId),
    cacheCall(coordinationGameAddress, 'applicantSecrets', applicationId),
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
          hintRandomAndSecret

        const {
          applicationRowObject,
          latestBlockTimestamp
        } = this.props

        let {
          applicantRevealExpiresAt,
          applicantsSecret,
          applicationId,
          createdAt,
          hint,
          random,
          secret,
          updatedAt,
          verifierChallengedAt,
          verifier,
          verifiersSecret,
          verifierSubmitSecretExpiresAt
        } = applicationRowObject

        const createdAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} delimiter={``} />
        const loadingOrCreatedAtTimestamp = createdAtDisplay

        const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
        const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

        const verifierSubmittedSecret = !isBlank(verifiersSecret)
        const applicantRevealedSecret = !isBlank(applicantsSecret)
        const applicantWon = (applicantsSecret === verifiersSecret)

        if (applicantRevealedSecret) {
          expirationMessage = (
            <React.Fragment>
              Application Complete
              <br />
              <strong>
                <abbr
                  data-for='expiration-message-tooltip'
                  data-tip={applicantWon ? `The Verifier's secret matched yours` : `The Verifier's secret did not match yours`}
                >
                  {applicantWon ? `You Won!` : `You Lost`}
                </abbr>
              </strong>
            </React.Fragment>
          )
        } else if (!isBlank(verifier) && !verifierSubmittedSecret) {
          expirationMessage = (
            <React.Fragment>
              <span className="has-text-grey">Waiting on <abbr data-tip={verifier} data-for='expiration-message-tooltip'>Verifier</abbr> until:</span>
              <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={verifierSubmitSecretExpiresAt} />
            </React.Fragment>
          )
        } else if (verifierSubmittedSecret && defined(random) && defined(secret)) {
          let secretAsHex
          const padLeft = getWeb3().utils.padLeft
          const toHex = getWeb3().utils.toHex

          if (secret) {
            secretAsHex = padLeft(toHex(secret.toString()), 32)
          }

          expirationMessage = (
            <React.Fragment>
              <span className="has-text-grey">Reveal your secret before:</span>
              <br /><RecordTimestampDisplay timeInUtcSecondsSinceEpoch={applicantRevealExpiresAt} />
              <br />
                <Web3ActionButton
                  contractAddress={this.props.coordinationGameAddress}
                  method='applicantRevealSecret'
                  args={[applicationId, secretAsHex, random.toString()]}
                  buttonText='Reveal Secret'
                  confirmationMessage='"Reveal Secret" transaction confirmed.'
                  txHashMessage='"Reveal Secret" transaction sent successfully -
                    it will take a few minutes to confirm on the Ethereum network.'/>
            </React.Fragment>
          )
        }

        if (verifierChallengedAt !== 0) {
          expirationMessage = <span className="has-text-warning">Verifier challenged your application</span>
        } else if (!isBlank(verifier) && (latestBlockTimestamp > verifierSubmitSecretExpiresAt)) {
          expirationMessage = <span className="has-text-warning">Verifier Failed to Respond</span>
        } else if (verifierSubmittedSecret && (latestBlockTimestamp > applicantRevealExpiresAt)) {
          expirationMessage = <span className="has-text-warning">Reveal Secret Expired</span>
        }

        if (hint && secret && random) {
          hintRandomAndSecret = (
            <React.Fragment>
              <strong>Hint:</strong> {hint}
              <br /><strong>Secret:</strong> {secret}
              <br /><strong>Random:</strong> {random.toString()}
            </React.Fragment>
          )
        } else {
          hintRandomAndSecret = (
            <abbr data-for='hint-random-secret-tooltip' data-tip="We were unable to find the original data for this application as it was probably saved in another Web3 browser. <br/>Please use that browser to reveal your secret.">not available</abbr>
          )
        }

        // necessary to show the verifier on 1st-time component load
        ReactTooltip.rebuild()

        return (
          <div className={classnames(
            'list--item',
            /*,
            { 'list--item__pending': pendingTransaction }
          */)}>
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
              {isBlank(verifier) && hint && secret && random
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
              <ReactTooltip
                id='expiration-message-tooltip'
                html={true}
                effect='solid'
                place={'top'}
                wrapper='span'
              />
            </span>
          </div>
        )
      }
    }
  )
)
