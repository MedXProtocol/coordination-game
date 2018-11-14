import React, { Component } from 'react'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get } from 'lodash'
import BN from 'bn.js'
import { Flipper, Flipped } from 'react-flip-toolkit'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import { toastr } from '~/toastr'
import { transactionFinders } from '~/finders/transactionFinders'
import {
  cacheCall,
  cacheCallValue,
  cacheCallValueInt,
  cacheCallValueBigNumber,
  contractByName,
  TransactionStateHandler,
  withSaga,
  withSend
} from 'saga-genesis'
import { ApplicantApplicationsTable } from '~/components/ApplicantApplicationsTable'
import { EtherFlip } from '~/components/EtherFlip'
import { GetTILWLink } from '~/components/GetTILWLink'
import { LoadingButton } from '~/components/LoadingButton'
import { Modal } from '~/components/Modal'
import { PageTitle } from '~/components/PageTitle'
import { Progress } from '~/components/Progress'
import { ScrollToTop } from '~/components/ScrollToTop'
import { storeApplicationDetailsInLocalStorage } from '~/services/storeApplicationDetailsInLocalStorage'
import { displayWeiToEther } from '~/utils/displayWeiToEther'
import { getWeb3 } from '~/utils/getWeb3'
import { isBlank } from '~/utils/isBlank'
import { defined } from '~/utils/defined'
import { weiToEther } from '~/utils/weiToEther'

function mapStateToProps(state) {
  let verifier,
    applicantsLastApplicationCreatedAt

  const transactions = get(state, 'sagaGenesis.transactions')
  const networkId = get(state, 'sagaGenesis.network.networkId')

  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const workTokenAddress = contractByName(state, 'WorkToken')

  const coordinationGameAllowance = cacheCallValueBigNumber(state, workTokenAddress, 'allowance', address, coordinationGameAddress)
  const tilwBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

  const approveTx = transactionFinders.findByMethodName(state, 'approve')

  const applicationStakeAmount = cacheCallValueBigNumber(state, coordinationGameAddress, 'applicationStakeAmount')
  const applicantsApplicationCount = cacheCallValueInt(state, coordinationGameAddress, 'getApplicantsApplicationCount')
  const applicantsLastApplicationId = cacheCallValueInt(state, coordinationGameAddress, 'getApplicantsLastApplicationID')
  const weiPerApplication = cacheCallValueBigNumber(state, coordinationGameAddress, 'weiPerApplication')

  if (applicantsLastApplicationId && applicantsLastApplicationId !== 0) {
    verifier = cacheCallValue(state, coordinationGameAddress, 'verifiers', applicantsLastApplicationId)
    applicantsLastApplicationCreatedAt = cacheCallValueInt(state, coordinationGameAddress, 'createdAt', applicantsLastApplicationId)
  }

  return {
    applicantsApplicationCount,
    applicantsLastApplicationCreatedAt,
    applicantsLastApplicationId,
    applicationStakeAmount,
    approveTx,
    address,
    coordinationGameAddress,
    coordinationGameAllowance,
    networkId,
    tilwBalance,
    transactions,
    verifier,
    weiPerApplication,
    workTokenAddress
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchShowLoadingStatus: () => {
      dispatch({ type: 'SHOW_LOADING_STATUS' })
    },
    dispatchHideLoadingStatus: () => {
      dispatch({ type: 'HIDE_LOADING_STATUS' })
    }
  }
}

function* applicantRegisterTokenSaga({
  workTokenAddress,
  coordinationGameAddress,
  address,
  applicantsLastApplicationId
}) {
  if (!workTokenAddress || !coordinationGameAddress || !address) { return null }

  yield all([
    cacheCall(workTokenAddress, 'balanceOf', address),
    cacheCall(workTokenAddress, 'allowance', address, coordinationGameAddress),
    cacheCall(coordinationGameAddress, 'applicationStakeAmount'),
    cacheCall(coordinationGameAddress, 'getApplicantsApplicationCount'),
    cacheCall(coordinationGameAddress, 'getApplicantsLastApplicationID'),
    cacheCall(coordinationGameAddress, 'weiPerApplication')
  ])

  if (applicantsLastApplicationId && applicantsLastApplicationId !== 0) {
    yield cacheCall(coordinationGameAddress, 'createdAt', applicantsLastApplicationId)
    yield cacheCall(coordinationGameAddress, 'verifiers', applicantsLastApplicationId)
  }
}

export const ApplicantRegisterTokenContainer = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(applicantRegisterTokenSaga)(
    withSend(
      class _ApplicantRegisterTokenContainer extends Component {

        constructor(props) {
          super(props)
          this.state = {
            tokenTicker: '',
            tokenName: '',
            hint: '...',
            secret: '',
            stepManual: 0,
            applicationCreated: false,
            beforeUnloadTriggered: false
          }

          this.tokenNameRef = React.createRef()
        }

        // everything stepManual is for testing animations and can safely be removed
        // for other devs who might not know keyCodes
        LEFT_KEY = 37
        RIGHT_KEY = 39

        _handleKeyDown = (event) => {
          if (window.location.hostname !== 'localhost') { return }

          switch( event.keyCode ) {
            case this.RIGHT_KEY:
              this.setState({ stepManual: Math.min(this.state.stepManual + 1, 3) })
              break;
            case this.LEFT_KEY:
              this.setState({ stepManual: Math.max(this.state.stepManual - 1, 0) })
              break;
            default:
              break;
          }
        }

        componentDidMount () {
          if (window) {
            window.onbeforeunload = this.handleBeforeUnload
          }
        }

        handleBeforeUnload = () => {
          if (this.step2Completed() && !this.step3Completed()) {
            this.setState({
              beforeUnloadTriggered: true
            })

            window.onbeforeunload = null

            return true
          }
        }

        componentWillMount () {
          document.addEventListener("keydown", this._handleKeyDown.bind(this));
        }

        componentWillReceiveProps (nextProps) {
          if (this.newApplication(nextProps)) {
            this.setState({
              applicationCreated: true
            })
            storeApplicationDetailsInLocalStorage(nextProps, this.state)
          }

          this.registerWorkTokenApproveHandlers(nextProps)
          this.registerCoordinationGameStartHandler(nextProps)
          this.registerCoordinationGameSelectVerifierHandler(nextProps)
        }

        componentWillUnmount () {
          if (window) {
            window.onbeforeunload = null
          }
        }

        handleCloseModal = () => {
          this.setState({
            beforeUnloadTriggered: false
          })
        }

        newApplication = (nextProps) => {
          const lastCreatedAt = this.props.applicantsLastApplicationCreatedAt
          const newCreatedAt = nextProps.applicantsLastApplicationCreatedAt
          const timestampChanged = lastCreatedAt !== newCreatedAt

          return (
            !defined(lastCreatedAt) &&
              defined(newCreatedAt) &&
              timestampChanged      &&
              defined(this.state.random)
          )
        }

        registerWorkTokenApproveHandlers = (nextProps) => {
          if (this.state.workTokenApproveHandler) {
            this.state.workTokenApproveHandler.handle(
              nextProps.transactions[this.state.workTokenApproveTxId]
            )
              .onError((error) => {
                this.props.dispatchHideLoadingStatus()

                console.log(error)
                this.setState({ workTokenApproveHandler: null })
                toastr.transactionError(error)
              })
              .onConfirmed(() => {
                this.setState({ workTokenApproveHandler: null })
                toastr.success('Approval for contract to spend TILW tokens confirmed.')
              })
              .onTxHash(() => {
                this.props.dispatchHideLoadingStatus()

                toastr.success('Approval for contract to spend TILW tokens sent - it will take a few minutes to confirm on the Ethereum network.')
              })
          }
        }

        registerCoordinationGameStartHandler = (nextProps) => {
          if (this.state.coordinationGameStartHandler) {
            this.state.coordinationGameStartHandler.handle(
              nextProps.transactions[this.state.coordinationGameStartTxId]
            )
              .onError((error) => {
                this.props.dispatchHideLoadingStatus()

                console.log(error)
                this.setState({ coordinationGameStartHandler: null })
                toastr.transactionError(error)
              })
              .onConfirmed(() => {
                this.setState({ coordinationGameStartHandler: null })
                toastr.success('Application submission confirmed.')
              })
              .onTxHash(() => {
                this.props.dispatchHideLoadingStatus()

                toastr.success('Application submitted successfully - it will take a few minutes to confirm on the Ethereum network.')
              })
          }
        }

        registerCoordinationGameSelectVerifierHandler = (nextProps) => {
          if (this.state.coordinationGameSelectVerifierHandler) {
            this.state.coordinationGameSelectVerifierHandler.handle(
              nextProps.transactions[this.state.coordinationGameSelectVerifierTxId]
            )
              .onError((error) => {
                this.props.dispatchHideLoadingStatus()

                console.log(error)
                this.setState({ coordinationGameSelectVerifierHandler: null })
                toastr.transactionError(error)
              })
              .onConfirmed(() => {
                this.setState({ coordinationGameSelectVerifierHandler: null })
                toastr.success('Verification request confirmed.')
              })
              .onTxHash(() => {
                this.props.dispatchHideLoadingStatus()

                toastr.success('Verification request sent successfully - it will take a few minutes to confirm on the Ethereum network.')
              })
          }
        }

        step1Completed = () => {
          const { coordinationGameAllowance, applicationStakeAmount } = this.props

          const valuesDefined = (defined(coordinationGameAllowance) && defined(applicationStakeAmount))
          const valuesAreEqual = (weiToEther(coordinationGameAllowance) === weiToEther(applicationStakeAmount))
          // console.log(valuesDefined, valuesAreEqual)

          return (this.state.stepManual > 0) ||
            (this.step2Completed() || (valuesDefined && valuesAreEqual))
        }

        step2Completed = () => {
          return (this.state.stepManual > 1) ||
            this.state.applicationCreated
        }

        step3Completed = () => {
          return (this.state.stepManual > 2) ||
            !isBlank(this.props.verifier)
        }

        formReady = () => {
          return (
            this.state.tokenName !== ''
            && this.state.tokenTicker !== ''
            && this.state.secret.length === 42
          )
        }

        handleSubmitApproval = (e) => {
          e.preventDefault()

          const { send, coordinationGameAddress, workTokenAddress } = this.props

          const workTokenApproveTxId = send(
            workTokenAddress,
            'approve',
            coordinationGameAddress,
            this.props.applicationStakeAmount
          )()

          this.setState({
            workTokenApproveHandler: new TransactionStateHandler(),
            workTokenApproveTxId
          })

          this.props.dispatchShowLoadingStatus()
        }

        handleSubmit = (e) => {
          e.preventDefault()

          const { send, coordinationGameAddress } = this.props
          const web3 = getWeb3()

          // needs to be BN ?
          // scrap leading 0's in tokenTicker, tokenName, hint, secret!
          // somehow make 100% sure we're not choosing a verifier that is the applicant!
          const random = new BN(Math.ceil(Math.random() * 1000000000 + 1000000000))

          const secretAsHex = web3.eth.abi.encodeParameter('uint256', this.state.secret)

          const secretRandomHash = getWeb3().utils.soliditySha3(
            { type: 'bytes32', value: secretAsHex },
            { type: 'uint256', value: random.toString() }
          )
          const randomHash = getWeb3().utils.soliditySha3(
            { type: 'uint256', value: random.toString() }
          )

          const hintString = `${this.state.tokenTicker} + ${this.state.tokenName}`
          const hint = web3.utils.utf8ToHex(hintString)

          window.web31 = getWeb3()
          window.bnn = BN

          const coordinationGameStartTxId = send(
            coordinationGameAddress,
            'start',
            secretRandomHash,
            randomHash,
            hint
          )({
            value: this.props.weiPerApplication
          })

          this.setState({
            coordinationGameStartHandler: new TransactionStateHandler(),
            coordinationGameStartTxId,
            random
          })

          this.props.dispatchShowLoadingStatus()
        }

        handleSubmitSelectVerifier = (e) => {
          e.preventDefault()

          const { send, coordinationGameAddress } = this.props

          const coordinationGameSelectVerifierTxId = send(
            coordinationGameAddress,
            'applicantRandomlySelectVerifier',
            this.props.applicantsLastApplicationId
          )()

          this.setState({
            coordinationGameSelectVerifierHandler: new TransactionStateHandler(),
            coordinationGameSelectVerifierTxId
          })

          this.props.dispatchShowLoadingStatus()
        }

        handleSecretChange = (e) => {
          this.setState({
            secret: e.target.value
          })
        }

        handleAddonClick = (e) => {
          e.preventDefault()

          this.tokenNameRef.current.focus()
        }

        handleHintChange = (e) => {
          // let val = parseInt(e.target.value, 10) || 0
          //
          // if (val < 10000) {
          //   this.setState({
          //     [e.target.name]: val
          //   }, this.updateFinalHint)
          // }

          let val = e.target.value

          this.setState({
            [e.target.name]: val
          }, this.updateFinalHint)
        }

        updateFinalHint = () => {
          this.setState({
            hint: `${this.state.tokenName} + ${this.state.tokenTicker}`
          })
        }

        render() {
          return (
            <Flipper flipKey={`${this.state.tokenName}-${this.state.tokenTicker}-${this.state.secret}-${this.state.applicationCount}`}>
              <PageTitle title='registerToken' />
              <ScrollToTop />

              <h1 className="is-size-1">
                Submit Token Details
              </h1>

              <p>
                <strong>Information you need:</strong> Token Name, Symbol and Contract owner address. <br className="is-hidden-touch" />Register a token in less than a minute.
              </p>

              <Progress
                labels={['Send Approval', 'Enter Token Details', 'Request Verification', 'Await Verification']}
                progressState={{
                  step1Active: !this.step1Completed(),
                  step2Active: this.step1Completed() && !this.step2Completed(),
                  step3Active: this.step2Completed() && !this.step3Completed(),
                  step4Active: false,

                  step1Complete: this.step1Completed() || this.step2Completed() || this.step3Completed(),
                  step2Complete: this.step2Completed() || this.step3Completed(),
                  step3Complete: this.step3Completed(),
                  step4Complete: this.step3Completed()
                }}
              />

              <h6 className="is-size-6">
                <span className="multistep-form--step-number">1.</span>
                Approve TILW
                {
                  this.step1Completed()
                  ? (
                    <React.Fragment>
                      &nbsp;<FontAwesomeIcon icon={faCheckCircle} width="100" className="has-text-primary" />
                    </React.Fragment>
                  ) : (
                    null
                  )
                }
              </h6>

              {this.step1Completed()
                ? (
                  null
                ) : (
                  <React.Fragment>
                    {
                      weiToEther(this.props.tilwBalance) < 1 ? (
                        <p>
                          You will need TEX to register a token
                          <br /><br /><GetTILWLink />
                        </p>
                      ) : (
                        <form onSubmit={this.handleSubmitApproval}>
                          <div className='columns'>
                            <div className='column is-8'>
                              <p>
                                The Trustless Incentivized List contract needs your permission to put down a deposit of <strong>{displayWeiToEther(this.props.applicationStakeAmount)} TEX</strong> to register a token. If your application is successful, half of this amount will be returned to you.
                              </p>
                            </div>
                          </div>

                          <LoadingButton
                            initialText='Approve'
                            loadingText='Approving'
                            isLoading={this.state.workTokenApproveHandler}
                          />
                        </form>
                      )
                    }
                  </React.Fragment>
                )
              }

              <div className="multistep-form--step-container">
                {
                  this.step1Completed()
                  ? (
                    <React.Fragment>
                      <h6 className="is-size-6">
                        <span className="multistep-form--step-number">2.</span>
                        Create a Hint and Secret for the Verifier to check
                        {
                          this.step2Completed()
                          ? (
                            <React.Fragment>
                              &nbsp;<FontAwesomeIcon icon={faCheckCircle} width="100" className="has-text-primary" />
                            </React.Fragment>
                          ) : (
                            <span className="help has-text-grey-dark">We're using ERC20 tokens as an example but you could use anything you'd like to verify <br className="is-hidden-touch" />(eg. if someone is a Doctor, etc.)</span>
                          )
                        }

                      </h6>


                      {
                        this.step2Completed()
                        ? (
                          null
                        ) : (
                          <div className="multistep-form--step-child">
                            <form onSubmit={this.handleSubmit}>
                              <h6 className="is-size-6">
                                a. Token Name <span className="has-text-grey-dark">(capitalize only first letter of every word):</span>
                              </h6>

                              <input
                                maxLength="40"
                                type="text"
                                name="tokenName"
                                className="text-input text-input--large text-input--extended"
                                placeholder="Decentraland"
                                onChange={this.handleHintChange}
                                value={this.state.tokenName}
                              />

                              <h6 className="is-size-6">
                                b. Token Symbol:
                              </h6>

                              <div className="field has-addons">
                                <p className="control">
                                  <button
                                    className="button is-static"
                                    tabIndex={-1}
                                    onClick={this.handleAddonClick}
                                  >
                                    $
                                  </button>
                                </p>
                                <p className="control">
                                  <input
                                    ref={this.tokenNameRef}
                                    maxLength="5"
                                    type="text"
                                    name="tokenTicker"
                                    className="text-input text-input--large"
                                    placeholder="MANA"
                                    onChange={this.handleHintChange}
                                    value={this.state.tokenTicker}
                                  />
                                </p>
                              </div>

                              {this.state.tokenTicker !== '' && this.state.tokenName !== '' ?
                                  (
                                    <Flipped flipId="wat">
                                      <React.Fragment>
                                        <h6 className="is-size-6">
                                          c. Token's Contract Address:
                                        </h6>
                                        <div className="field">
                                          <div className="control">
                                            <input
                                              name="tokenContractAddress"
                                              type="text"
                                              maxLength="42"
                                              placeholder="0x..."
                                              className="text-input text-input--large is-marginless text-input--extended-extra"
                                              pattern="^(0x)?[0-9a-f]{40}$"
                                              onChange={this.handleSecretChange}
                                            />
                                          </div>
                                        </div>
                                      </React.Fragment>
                                    </Flipped>
                                  )
                                : null
                              }

                              <Flipped flipId="coolDiv">
                                <div className={this.formReady() ? 'is-visible' : 'is-hidden'}>
                                  <br />
                                  <LoadingButton
                                    initialText='Submit Hint &amp; Secret'
                                    loadingText='Submitting'
                                    isLoading={this.state.coordinationGameStartHandler}
                                  />

                                  <br />
                                  <p className="help has-text-grey">
                                    <EtherFlip wei={this.props.weiPerApplication} /> to submit an application
                                  </p>

                                </div>
                              </Flipped>

                            </form>
                          </div>
                        )
                      }

                    </React.Fragment>
                  ) : (
                    null
                  )
                }
              </div>

              <div className="multistep-form--step-container">
                {
                  this.step2Completed()
                  ? (
                    <React.Fragment>
                      <h6 className="is-size-6">
                        <span className="multistep-form--step-number">3.</span>
                        Request Verification
                        {
                          this.step3Completed()
                          ? (
                            <React.Fragment>
                              &nbsp;<FontAwesomeIcon icon={faCheckCircle} width="100" className="has-text-primary" />
                            </React.Fragment>
                          ) : (
                            null
                          )
                        }
                      </h6>


                      {
                        this.step3Completed()
                        ? (
                          <div className='columns'>
                            <div className='column is-8'>
                              <p>
                                Your application has been sent for review. The
                                reviewer will attempt to verify the accuracy of your application,
                                after which you will need to come back and reveal your secret.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={this.handleSubmitSelectVerifier}>
                            <div className='columns'>
                              <div className='column is-8'>
                                <p>
                                  Your application requires you to choose a verifier at random. This uses the next block's hash for unique randomness.
                                </p>
                              </div>
                            </div>

                            <LoadingButton
                              initialText='Request Verification'
                              loadingText='Requesting'
                              isLoading={this.state.coordinationGameSelectVerifierHandler}
                            />
                          </form>
                        )
                      }

                    </React.Fragment>
                  ) : (
                    null
                  )
                }
              </div>

              <br />
              <br />
              <br />


              <div className="is-clearfix">
                <h6 className="is-size-6">
                  Your Current Applications:
                </h6>
              </div>
              <ApplicantApplicationsTable />

              <Modal
                closeModal={this.handleCloseModal}
                modalState={this.state.beforeUnloadTriggered}
                title="Unload warning modal"
              >
                <div className='has-text-centered'>
                  <h3 className="is-size-3">
                    You're leaving?
                  </h3>

                  <p>
                    You haven't finished your application yet!
                  </p>
                  <p>
                    Once you have finished the <strong>'Request Verification'</strong> step your application will be complete.
                  </p>
                  <br />

                  <p>
                    <br />
                    <button
                      onClick={this.handleCloseModal}
                      className="button is-primary is-outlined"
                    >
                      Whoops, thanks for the reminder! I'll finish it up.
                    </button>
                  </p>
                  <br />
                  <p>
                    We'll only warn you once, so feel free to leave if you would like!
                  </p>
                </div>
              </Modal>

            </Flipper>
          )
        }
      }
    )
  )
)
