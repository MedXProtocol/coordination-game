import ReactDOMServer from 'react-dom/server'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import ReactTooltip from 'react-tooltip'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { all } from 'redux-saga/effects'
import { toastr } from '~/toastr'
import { get } from 'lodash'
import {
  cacheCallValue,
  cacheCallValueInt,
  contractByName,
  cacheCall,
  TransactionStateHandler,
  withSaga,
  withSend
} from 'saga-genesis'
import { LoadingLines } from '~/components/LoadingLines'
import { RecordTimestampDisplay } from '~/components/RecordTimestampDisplay'
import { getWeb3 } from '~/utils/getWeb3'

function mapStateToProps(state, { applicationId }) {
  let createdAt, updatedAt, hint
  let applicationObject = {}

  const transactions = get(state, 'sagaGenesis.transactions')

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')

  if (applicationId) {
    createdAt = cacheCallValueInt(state, coordinationGameAddress, 'createdAt', applicationId)
    updatedAt = cacheCallValueInt(state, coordinationGameAddress, 'updatedAt', applicationId)

    hint = cacheCallValue(state, coordinationGameAddress, 'hints', applicationId)
    if (hint) {
      hint = getWeb3().utils.hexToAscii(hint)
    }

    applicationObject = {
      applicationId,
      createdAt,
      updatedAt,
      hint
    }
  }

  return {
    coordinationGameAddress,
    applicationObject,
    transactions
  }
}

function* verifyApplicationSaga({ coordinationGameAddress, applicationId }) {
  if (!coordinationGameAddress || !applicationId) { return }

  yield all([
    cacheCall(coordinationGameAddress, 'hints', applicationId),
    cacheCall(coordinationGameAddress, 'createdAt', applicationId),
    cacheCall(coordinationGameAddress, 'updatedAt', applicationId)
  ])
}

function mapDispatchToProps (dispatch) {
  return {
    dispatchHideVerifyApplication: () => {
      dispatch({ type: 'HIDE_VERIFY_APPLICATION' })
    }
  }
}

export const VerifyApplication = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(verifyApplicationSaga)(
    withSend(
      class _VerifyApplication extends Component {

        constructor(props) {
          super(props)
          this.state = {
            secret: ''
          }
        }

        static propTypes = {
          applicationId: PropTypes.number
        }

        componentWillReceiveProps (nextProps) {
          this.registerVerifierSubmitSecretHandlers(nextProps)
        }

        registerVerifierSubmitSecretHandlers = (nextProps) => {
          if (this.state.verifierSubmitSecretHandler) {
            this.state.verifierSubmitSecretHandler.handle(
              nextProps.transactions[this.state.verifierSubmitSecretTxId]
            )
              .onError((error) => {
                console.log(error)
                this.setState({ verifierSubmitSecretHandler: null })
                toastr.transactionError(error)
              })
              .onConfirmed(() => {
                this.setState({ verifierSubmitSecretHandler: null })
                toastr.success(`Verification secret transaction for application #${this.props.applicationId} has been confirmed.`)
              })
              .onTxHash(() => {
                toastr.success('Verification secret sent - it will take a few minutes to confirm on the Ethereum network.')
                this.props.dispatchHideVerifyApplication()
              })
          }
        }

        handleVerifierSecretSubmit = (e) => {
          e.preventDefault()

          const { send, coordinationGameAddress } = this.props

          const secret = getWeb3().utils.sha3(this.state.secret)

          const verifierSubmitSecretTxId = send(
            coordinationGameAddress,
            'verifierSubmitSecret',
            this.props.applicationId,
            secret
          )()
          console.log(verifierSubmitSecretTxId)

          this.setState({
            verifierSubmitSecretHandler: new TransactionStateHandler(),
            verifierSubmitSecretTxId
          })
        }

        handleCloseClick = (e) => {
          e.preventDefault()

          this.props.dispatchHideVerifyApplication()
        }

        handleTextInputChange = (e) => {
          this.setState({
            [e.target.name]: e.target.value
          })
        }

        render () {
          const { applicationObject } = this.props

          let {
            applicationId,
            createdAt,
            updatedAt,
            hint
          } = applicationObject

          const updatedAtDisplay = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} delimiter={``} />

          const createdAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={createdAt} />
          const updatedAtTooltip = <RecordTimestampDisplay timeInUtcSecondsSinceEpoch={updatedAt} />

          const loadingOrUpdatedAtTimestamp = updatedAtDisplay

          return (
            <div className={classnames(
            )}>
              <div className="has-text-right">
                <button
                  className="is-warning is-outlined is-pulled-right delete is-large"
                  onClick={this.handleCloseClick}
                >

                </button>
              </div>

              <h5 className="is-size-5 has-text-grey">
                Application #{applicationId}
              </h5>

              <h3 className="is-size-3 has-text-grey-light">
                Hint: {hint}
              </h3>

              <br />

              <form onSubmit={this.handleVerifierSecretSubmit}>
                <h6 className="is-size-6">
                  Provide your secret as verification:
                </h6>
                <input
                  type="text"
                  name="secret"
                  className="text-input text-input--large"
                  placeholder=""
                  onChange={this.handleTextInputChange}
                  value={this.state.secret}
                />

                <br />

                <button
                  type="submit"
                  className="button is-outlined is-primary"
                  disabled={this.state.secret === '' || this.state.verifierSubmitSecretHandler}
                >
                  Submit Verification
                </button>

                <LoadingLines
                  visible={this.state.verifierSubmitSecretHandler}
                />
              </form>

              <hr />

              <h6 className="has-text-centered is-size-6 has-text-grey">
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
              </h6>
            </div>
          )
        }
      }
    )
  )
)