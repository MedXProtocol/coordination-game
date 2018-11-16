import ReactDOMServer from 'react-dom/server'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import ReactTooltip from 'react-tooltip'
import { formatRoute } from 'react-router-named-routes'
import { Link } from 'react-router-dom'
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
import { defined } from '~/utils/defined'
import { isBlank } from '~/utils/isBlank'
import { getWeb3 } from '~/utils/getWeb3'
import { hexHintToTokenData } from '~/utils/hexHintToTokenData'
import { get } from 'lodash'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { applicationId }) {
  let applicantRevealTimeoutInSeconds,
    applicationRowObject,
    verifierTimeoutInSeconds

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

  const hexHint = cacheCallValue(state, coordinationGameAddress, 'hints', applicationId)

  // Parse and convert the generic hint field to our DApp-specific data
  const [tokenTicker, tokenName] = hexHintToTokenData(hexHint)

  applicationRowObject = {
    applicantsSecret,
    applicationId,
    createdAt,
    verifierChallengedAt,
    tokenTicker,
    tokenName,
    verifier,
    verifiersSecret,
    updatedAt
  }

  if (!isBlank(verifier)) {
    verifierTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'verifierTimeoutInSeconds')
    applicantRevealTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'applicantRevealTimeoutInSeconds')
  }

  applicationRowObject = retrieveApplicationDetailsFromLocalStorage(
    applicationRowObject,
    networkId,
    address,
    createdAt
  )

  applicationRowObject.verifierSubmitSecretExpiresAt = updatedAt + verifierTimeoutInSeconds
  applicationRowObject.applicantRevealExpiresAt      = updatedAt + applicantRevealTimeoutInSeconds

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
    cacheCall(coordinationGameAddress, 'applicantRevealTimeoutInSeconds'),
    cacheCall(coordinationGameAddress, 'verifierTimeoutInSeconds')
  ])
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
      //         <span className="list--item__view__view">View Application&nbsp;</span>
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
          tokenTicker,
          tokenName,
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
              Submission Complete
              <br />
              <strong>
                <abbr
                  data-for='expiration-message-tooltip'
                  data-tip={applicantWon ? `The Verifier entered the same contract address as you` : `The Verifier entered a different secret that did not match yours`}
                >
                  {applicantWon ? `Contract Addresses Matched` : `Contract Addresses Did Not Match`}
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

          if (secret) {
            secretAsHex = getWeb3().eth.abi.encodeParameter('uint256', secret.toString())
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
                  loadingText='Revealing'
                  isSmall={true}
                  confirmationMessage='"Reveal Secret" transaction confirmed.'
                  txHashMessage='"Reveal Secret" transaction sent successfully -
                    it will take a few minutes to confirm on the Ethereum network.'/>
            </React.Fragment>
          )
        }

        if (verifierChallengedAt !== 0) {
          expirationMessage = <span className="has-text-warning">Verifier challenged your application</span>
        } else if (verifierSubmittedSecret && (latestBlockTimestamp > applicantRevealExpiresAt)) {
          expirationMessage = <span className="has-text-grey">You missed the reveal secret deadline</span>
        } else if (!isBlank(verifier) && (latestBlockTimestamp > verifierSubmitSecretExpiresAt)) {
          expirationMessage = (
            <React.Fragment>
              <span className="has-text-warning">Verifier Failed to Respond</span>
              <Web3ActionButton
                contractAddress={this.props.coordinationGameAddress}
                method='applicantRandomlySelectVerifier'
                args={[applicationId]}
                isSmall={true}
                buttonText='Request New Verifier'
                loadingText='Requesting New Verifier'
                confirmationMessage='New verifier request confirmed.'
                txHashMessage='New verifier request sent successfully -
                  it will take a few minutes to confirm on the Ethereum network.' />
            </React.Fragment>
          )
        }

        if (tokenName && tokenTicker && secret && random) {
          hintRandomAndSecret = (
            <React.Fragment>
              Token Name: <strong>{tokenName}</strong>
              <br />
              Token Ticker: <strong>{tokenTicker}</strong>
              <br />
              Secret: <strong>{secret}</strong>
              <br />
              Random: <strong>{random.toString()}</strong>
            </React.Fragment>
          )
        } else {
          hintRandomAndSecret = (
            <abbr data-for='hint-random-secret-tooltip' data-tip="We were unable to find the original data for this application as it was probably saved in another Web3 browser. <br/>Please use that browser to reveal your secret.">not available</abbr>
          )
        }

        // necessary to show the verifier on 1st-time component load
        // ReactTooltip.rebuild()

        console.log(formatRoute(routes.APPLICATION, this.props.applicationId))

        return (
          <Link
            to={formatRoute(routes.APPLICATION, { applicationId: this.props.applicationId } )}
            className="list--item"
          >
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
              <button className="button is-primary is-small is-outlined">View</button>
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
