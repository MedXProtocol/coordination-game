import React, { Component } from 'react'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get } from 'lodash'
import BN from 'bn.js'
import { Flipper, Flipped } from 'react-flip-toolkit'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import {
  cacheCall,
  cacheCallValueBigNumber,
  contractByName,
  TransactionStateHandler,
  withSaga,
  withSend
} from 'saga-genesis'
import { toastr } from '~/toastr'
import { transactionFinders } from '~/finders/transactionFinders'
import { GetTILWLink } from '~/components/GetTILWLink'
import { ScrollToTop } from '~/components/ScrollToTop'
import { getWeb3 } from '~/utils/getWeb3'
import { etherToWei } from '~/utils/etherToWei'
import { weiToEther } from '~/utils/weiToEther'

function mapStateToProps(state) {
  const transactions = get(state, 'sagaGenesis.transactions')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const workTokenAddress = contractByName(state, 'WorkToken')

  // const minDeposit = cacheCallValueBigNumber(state, coordinationGameAddress, 'minDeposit')
  // console.log(minDeposit)
  const coordinationGameAllowance = cacheCallValueBigNumber(state, workTokenAddress, 'allowance', address, coordinationGameAddress)
  const tilwBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

  const approveTx = transactionFinders.approve(state)
  // console.log(approveTx)

  const applicationStakeAmount = cacheCallValueBigNumber(state, coordinationGameAddress, 'applicationStakeAmount')

  return {
    applicationStakeAmount,
    approveTx,
    address,
    coordinationGameAddress,
    coordinationGameAllowance,
    // minDeposit,
    tilwBalance,
    transactions,
    workTokenAddress
  }
}

function* applicantApplySaga({ workTokenAddress, coordinationGameAddress, address }) {
  if (!workTokenAddress || !coordinationGameAddress || !address) { return null }

  yield all([
    cacheCall(workTokenAddress, 'balanceOf', address),
    cacheCall(workTokenAddress, 'allowance', address, coordinationGameAddress),
    cacheCall(coordinationGameAddress, 'applicationStakeAmount')
  ])
}

export const ApplicantApplyContainer = connect(mapStateToProps)(
  withSaga(applicantApplySaga)(
    withSend(
      class _ApplicantApplyContainer extends Component {

        constructor(props) {
          super(props)
          this.state = {
            hintLeft: '',
            hintRight: '',
            hint: '',
            secret: '',
            txInFlight: false
          }
        }

        componentWillReceiveProps (props) {
          if (this.state.workTokenApproveHandler) {
            this.state.workTokenApproveHandler.handle(
              props.transactions[this.state.workTokenApproveTxId]
            )
              .onError((error) => {
                console.log(error)
                toastr.transactionError(error)
                this.setState({ workTokenApproveHandler: null })
              })
              .onConfirmed(() => {
                this.setState({ workTokenApproveHandler: null })
              })
              .onTxHash(() => {
                // this.setState({ txInFlight: true })
                toastr.success('Approval for contract to spend TILW tokens sent! It will take a few minutes to confirm on the Ethereum network.')
              })
          }

          if (this.state.coordinationGameStartHandler) {
            this.state.coordinationGameStartHandler.handle(
              props.transactions[this.state.coordinationGameStartTransactionId]
            )
              .onError((error) => {
                console.log(error)
                toastr.transactionError(error)
                this.setState({ coordinationGameStartHandler: null })
              })
              .onConfirmed(() => {
                this.setState({ coordinationGameStartHandler: null })
              })
              .onTxHash(() => {
                this.setState({ txInFlight: true })
                toastr.success('Application submitted successfully. It will take a few minutes to confirm on the Ethereum network.')
              })
          }
        }

        formReady = () => {
          return (
            this.state.hintRight !== ''
            && this.state.hintLeft !== ''
            && this.state.secret !== ''
          )
        }

        handleSubmitApproval = (e) => {
          e.preventDefault()

          const { send, coordinationGameAddress, workTokenAddress } = this.props

          const workTokenApproveTxId = send(
            workTokenAddress,
            'approve',
            coordinationGameAddress,
            etherToWei(20)
          )()

          this.setState({
            workTokenApproveHandler: new TransactionStateHandler(),
            workTokenApproveTxId
          })
        }

        handleSubmit = (e) => {
          e.preventDefault()

          const { send, coordinationGameAddress } = this.props
          const padLeft = getWeb3().utils.padLeft
          const toHex = getWeb3().utils.toHex

          const random = new BN(Math.ceil(Math.random(1) * 1000000))

          const secretRandomHash = getWeb3().utils.sha3(
            ['bytes32', 'uint256'],
            [this.state.secret, random]
          ).toString('hex')
          const randomHash = getWeb3().utils.sha3(
            ['uint256'],
            [random]
          ).toString('hex')

          const hintString = `${this.state.hintLeft} + ${this.state.hintRight}`
          const hint = padLeft(toHex(hintString), 32)

          console.log(secretRandomHash, randomHash, hint)


          const coordinationGameStartTransactionId = send(
            coordinationGameAddress,
            'start',
            secretRandomHash,
            randomHash,
            hint
          )()

          this.setState({
            coordinationGameStartHandler: new TransactionStateHandler(),
            coordinationGameStartTransactionId
          })
        }

        handleSecretChange = (e) => {
          this.setState({
            secret: e.target.value
          })
        }

        handleHintChange = (e) => {
          let val = parseInt(e.target.value, 10) || 0

          if (val < 10000) {
            this.setState({
              [e.target.name]: val
            }, this.updateFinalHint)
          }
        }

        updateFinalHint = () => {
          this.setState({
            hint: this.state.hintLeft + this.state.hintRight
          })
        }

        render() {
          console.log(this.state.workTokenApproveHandler)

          if (this.state.txInFlight) {
            return (
              <div className="multistep-form--step-container">
                <h3>
                  Application submitted.
                </h3>
                Loading Spinner.
              </div>
            )
          }

          return (
            <Flipper flipKey={`${this.state.hintRight}-${this.state.hintLeft}-${this.state.secret}-${this.state.txInFlight}`}>
              <ScrollToTop />

              <h1>
                Apply to be on the TIL
              </h1>

              <h6 className="is-size-6">
                1. Approve TILW
                {
                  (weiToEther(this.props.coordinationGameAllowance) === weiToEther(this.props.applicationStakeAmount))
                  ? (
                    <React.Fragment>
                      &nbsp;<FontAwesomeIcon icon={faCheckCircle} width="100" className="has-text-primary" />
                    </React.Fragment>
                  ) : (
                    null
                  )
                }
              </h6>

              {(weiToEther(this.props.coordinationGameAllowance) === weiToEther(this.props.applicationStakeAmount))
                ? (
                  null
                ) : (
                  <React.Fragment>
                    {
                      weiToEther(this.props.tilwBalance) < 1 ? (
                        <p>
                          You need TILW before you can approve:
                          <br /><br /><GetTILWLink />
                        </p>
                      ) : (
                        <form onSubmit={this.handleSubmitApproval}>
                          <div className='columns'>
                            <div className='column is-8'>
                              <p>
                                The TIL contract needs your permission to stake <strong>{weiToEther(this.props.applicationStakeAmount)} TILW</strong> to apply. If your application is successful, half of this amount will be returned to you.
                              </p>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="button is-outlined is-primary"
                          >
                            Approve
                          </button>
                        </form>

                      )
                    }
                  </React.Fragment>
                )
              }

              <div className="multistep-form--step-container">
                {
                  (weiToEther(this.props.coordinationGameAllowance) === weiToEther(this.props.applicationStakeAmount))
                  ? (
                    <React.Fragment>
                      <h6 className="is-size-6">
                        2. Create a Hint and Secret for the Verifier to check
                        {
                          (false)
                          ? (
                            <React.Fragment>
                              &nbsp;<FontAwesomeIcon icon={faCheckCircle} width="100" className="has-text-primary" />
                            </React.Fragment>
                          ) : (
                            null
                          )
                        }
                      </h6>
                      <div className="multistep-form--step-child">
                        <form onSubmit={this.handleSubmit}>
                          <h6 className="is-size-6">
                            a. Provide a hint for the verifier:
                          </h6>
                          <input
                            name="hintLeft"
                            className="text-input text-input--large"
                            placeholder="345"
                            onChange={this.handleHintChange}
                            value={this.state.hintLeft}
                          />
                          <span className="text-operator">+</span>

                          <input
                            name="hintRight"
                            className="text-input text-input--large"
                            placeholder="223"
                            onChange={this.handleHintChange}
                            value={this.state.hintRight}
                          />
                          <span className="text-operator">=</span>

                          <input
                            name="hint"
                            className="readonly text-input text-input--large"
                            placeholder=""
                            value={this.state.hint}
                            readOnly={true}
                          />

                          <br />
                          {this.state.hintLeft !== '' && this.state.hintRight !== '' ?
                              (
                                <Flipped flipId="coolDiv">
                                  <React.Fragment>
                                    <h6 className="is-size-6">
                                      b. Provide a secret:
                                    </h6>
                                    <div className="field">
                                      <div className="control">
                                        <input
                                          className="text-input text-input--large is-marginless"
                                          pattern="[0-9]*"
                                          onChange={this.handleSecretChange}
                                        />
                                      </div>
                                      <p className="help has-text-grey">
                                        This could be {this.state.hint} (typical use case) or any other number up to 20000 (nefarious use case)
                                      </p>
                                    </div>
                                  </React.Fragment>
                                </Flipped>
                              )
                            : null
                          }


                          <Flipped flipId="coolDiv">
                            <div className={this.formReady() ? 'is-visible' : 'is-hidden'}>
                              <br />
                              <button
                                type="submit"
                                className="button is-outlined is-primary"
                              >
                                Submit Hint &amp; Secret
                              </button>
                            </div>
                          </Flipped>

                        </form>
                      </div>
                    </React.Fragment>
                  ) : (
                    null
                  )
                }
              </div>

            </Flipper>
          )
        }
      }
    )
  )
)
