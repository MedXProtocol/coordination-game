import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get } from 'lodash'
import { AnimatedWrapper } from "~/components/Layout/AnimatedWrapper"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import { toastr } from '~/toastr'
import { transactionFinders } from '~/finders/transactionFinders'
import ReactTooltip from 'react-tooltip'
import randomBytes from 'randombytes'
import queryString from 'query-string'
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
import { ApplicantApplicationsTable } from '~/components/Applications/ApplicantApplicationsTable'
import { EtherFlip } from '~/components/Helpers/EtherFlip'
import { Footer } from '~/components/Layout/Footer'
import { GetTEXLink } from '~/components/Helpers/GetTEXLink'
import { LoadingButton } from '~/components/Helpers/LoadingButton'
import { Modal } from '~/components/Modals/Modal'
import { PageTitle } from '~/components/Helpers/PageTitle'
import { Progress } from '~/components/Helpers/Progress'
import { ScrollToTop } from '~/components/Helpers/ScrollToTop'
import { storeApplicationDetailsInLocalStorage } from '~/services/storeApplicationDetailsInLocalStorage'
import { displayWeiToEther } from '~/utils/displayWeiToEther'
import { getWeb3 } from '~/utils/getWeb3'
import { isBlank } from '~/utils/isBlank'
import { defined } from '~/utils/defined'
import { weiToEther } from '~/utils/weiToEther'
import { mapToGame } from '~/services/mapToGame'
import { mapToVerification } from '~/services/mapToVerification'
import { tickerToBytes32 } from '~/utils/tickerToBytes32'

function mapStateToProps(state, { location }) {
  let verifier,
    applicantsLastApplicationCreatedAt,
    applicationExists,
    listingExists,
    waitingOnBlockToMine

  const applicantApplicationsTableCurrentPage = queryString.parse(location.search).applicantApplicationsTableCurrentPage

  const address = get(state, 'sagaGenesis.accounts[0]')
  const latestBlockNumber = get(state, 'sagaGenesis.block.latestBlock.number')
  const networkId = get(state, 'sagaGenesis.network.networkId')
  const transactions = get(state, 'sagaGenesis.transactions')

  const query = get(state, 'search.query')
  const hexQuery = getWeb3().utils.asciiToHex(get(state, 'search.query'))

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const tilRegistryAddress = contractByName(state, 'TILRegistry')
  const workTokenAddress = contractByName(state, 'WorkToken')

  const coordinationGameAllowance = cacheCallValueBigNumber(state, workTokenAddress, 'allowance', address, coordinationGameAddress)
  const texBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

  const approveTx = transactionFinders.findByMethodName(state, 'approve')

  const applicationStakeAmount = cacheCallValueBigNumber(state, coordinationGameAddress, 'applicationStakeAmount')
  const applicantsApplicationCount = cacheCallValueInt(state, coordinationGameAddress, 'getApplicantsApplicationCount', address)
  const applicantsLastApplicationId = cacheCallValue(state, coordinationGameAddress, 'getApplicantsLastApplicationID', address)
  const weiPerApplication = cacheCallValueBigNumber(state, coordinationGameAddress, 'weiPerApplication')

  if (hexQuery !== '0x00') { // blank / undefined is translating to 0x00 in hex
    listingExists     = cacheCallValue(state, tilRegistryAddress, 'listingExists', hexQuery)
    applicationExists = cacheCallValue(state, coordinationGameAddress, 'applicationExists', hexQuery)
  }

  if (!isBlank(applicantsLastApplicationId)) {
    const verification = mapToVerification(cacheCallValue(state, coordinationGameAddress, 'verifiers', applicantsLastApplicationId))
    verifier = verification.verifier

    const game = mapToGame(cacheCallValue(state, coordinationGameAddress, 'games', applicantsLastApplicationId))
    applicantsLastApplicationCreatedAt = game.createdAt

    waitingOnBlockToMine = (latestBlockNumber < parseInt(game.randomBlockNumber, 10))
  }

  return {
    applicantsApplicationCount,
    applicantsLastApplicationCreatedAt,
    applicantsLastApplicationId,
    applicationExists,
    applicationStakeAmount,
    applicantApplicationsTableCurrentPage,
    approveTx,
    address,
    coordinationGameAddress,
    coordinationGameAllowance,
    listingExists,
    networkId,
    query,
    texBalance,
    transactions,
    verifier,
    waitingOnBlockToMine,
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
    },
    dispatchUpdateSearchQuery: ({ query }) => {
      dispatch({ type: 'UPDATE_SEARCH_QUERY', query })
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
    cacheCall(coordinationGameAddress, 'getApplicantsApplicationCount', address),
    cacheCall(coordinationGameAddress, 'getApplicantsLastApplicationID', address),
    cacheCall(coordinationGameAddress, 'weiPerApplication')
  ])

  if (applicantsLastApplicationId && applicantsLastApplicationId !== 0) {
    yield cacheCall(coordinationGameAddress, 'games', applicantsLastApplicationId)
    yield cacheCall(coordinationGameAddress, 'verifications', applicantsLastApplicationId)
  }
}

export const ApplicantRegisterTokenContainer = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(applicantRegisterTokenSaga)(
    withSend(
      AnimatedWrapper(
        class _ApplicantRegisterTokenContainer extends PureComponent {

          constructor(props) {
            super(props)
            this.state = {
              tokenTicker: '',
              tokenName: '',
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
            this.observeExistance(nextProps)
            this.observeNewApplication(nextProps)

            this.registerWorkTokenApproveHandlers(nextProps)
            this.registerCoordinationGameStartHandler(nextProps)
            this.registerCoordinationGameSelectVerifierHandler(nextProps)
          }

          componentWillUnmount () {
            if (window) {
              window.onbeforeunload = null
            }
          }

          observeExistance = (nextProps) => {
            if (
                 (this.props.listingExists !== nextProps.listingExists)
              || (this.props.applicationExists !== nextProps.applicationExists)
            ) {
              this.setState({
                listingOrApplicationExists: nextProps.listingExists || nextProps.applicationExists
              })
            }
          }

          observeNewApplication = (nextProps) => {
            if (this.newApplication(nextProps)) {
              this.setState({
                applicationCreated: true
              })

              storeApplicationDetailsInLocalStorage(nextProps, this.state)
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
              isBlank(lastCreatedAt) &&
                !isBlank(newCreatedAt) &&
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
                  toastr.success('Approval for contract to spend TEX tokens confirmed.')
                })
                .onTxHash(() => {
                  this.props.dispatchHideLoadingStatus()

                  toastr.success('Approval for contract to spend TEX tokens sent - it will take a few minutes to confirm on the Ethereum network.')
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

          dataReady = () => {
            const {
              coordinationGameAllowance,
              applicationStakeAmount,
              applicantsLastApplicationId
            } = this.props

            const valuesDefined = (
              defined(coordinationGameAllowance)
              && defined(applicationStakeAmount)
              && defined(applicantsLastApplicationId)
            )
            return valuesDefined
          }

          step1Completed = () => {
            const { coordinationGameAllowance, applicationStakeAmount } = this.props

            const valuesDefined = (defined(coordinationGameAllowance) && defined(applicationStakeAmount))
            const valuesAreEqual = (weiToEther(coordinationGameAllowance) === weiToEther(applicationStakeAmount))

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
              !this.state.listingOrApplicationExists
              && this.state.tokenName !== ''
              && this.tokenTickerValid()
              && this.state.tokenTicker !== ''
              && this.secretValid()
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

            const bytes = randomBytes(32)
            const random = Buffer.from(bytes).toString('hex')

            const secretAsHex = web3.eth.abi.encodeParameter('uint256', this.state.secret.trim())

            const secretRandomHash = getWeb3().utils.soliditySha3(
              { type: 'bytes32', value: secretAsHex },
              { type: 'uint256', value: random.toString() }
            )
            const randomHash = getWeb3().utils.soliditySha3(
              { type: 'uint256', value: random.toString() }
            )

            const hexHint = web3.utils.utf8ToHex(this.state.tokenName.trim())
            const applicationId = tickerToBytes32(this.state.tokenTicker)

            const coordinationGameStartTxId = send(
              coordinationGameAddress,
              'start',
              applicationId,
              secretRandomHash,
              randomHash,
              hexHint
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

          handleAddonClick = (e) => {
            e.preventDefault()

            this.tokenNameRef.current.focus()
          }

          handleTextInputChange = (e) => {
            this.setState({
              [e.target.name]: e.target.value
            })
          }

          checkExistance = (e) => {
            this.props.dispatchUpdateSearchQuery({ query: e.target.value })
          }

          tokenTickerValid = () => {
            return this.state.tokenTicker.match(/^[a-zA-Z0-9]+$/)
          }

          secretValid = () => {
            return this.state.secret.match(/^(0x)?[0-9a-fA-F]{40}$/)
          }

          render() {
            if (!this.dataReady()) {
              return null
            }

            return (
              <React.Fragment>
                <PageTitle title='registerToken' />
                <ScrollToTop disabled={this.props.applicantApplicationsTableCurrentPage} />

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


                {this.dataReady() ? (
                  <React.Fragment>
                    <h6 className="is-size-6">
                      <span className="multistep-form--step-number">1.</span>
                      Approve TEX
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

                    {!this.step1Completed()
                      ? (
                        <React.Fragment>
                          {
                            weiToEther(this.props.texBalance) < 1 ? (
                              <p>
                                You will need TEX to register a token
                                <br />
                                <br />
                                <GetTEXLink />
                                <br />
                                <br />
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
                                <br />
                                <br />
                              </form>
                            )
                          }
                        </React.Fragment>
                      ) : null
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
                                  <form onSubmit={this.handleSubmit} className="form--submit-token">
                                    <h6 className="is-size-6">
                                      a. Token Name <span className="has-text-grey-dark">(capitalize only first letter of every word):</span>
                                    </h6>

                                    <div className="field">
                                      <p className="control">
                                        <input
                                          maxLength="40"
                                          type="text"
                                          name="tokenName"
                                          className="text-input text-input--large text-input--extended is-marginless"
                                          placeholder="Decentraland"
                                          onChange={this.handleTextInputChange}
                                          value={this.state.tokenName}
                                        />
                                      </p>
                                    </div>

                                    <h6 className="is-size-6">
                                      b. Token Symbol:
                                    </h6>

                                    <div className="field has-addons">
                                      <div className="control-with-addons">
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
                                            pattern="^[a-zA-Z0-9]+$"
                                            className="text-input text-input--large is-marginless"
                                            placeholder="MANA"
                                            onChange={this.handleTextInputChange}
                                            value={this.state.tokenTicker}
                                            onBlur={this.checkExistance}
                                          />
                                        </p>
                                      </div>
                                      {(!this.tokenTickerValid() && this.state.tokenTicker !== '') ? <span className="help has-text-grey">Please enter only alphanumeric characters</span> : null }

                                      {this.state.listingOrApplicationExists ? <span className="help has-text-warning">An application or listing token with this ticker already exists</span> : null }
                                    </div>

                                    <h6 className="is-size-6">
                                      c. Token's Contract Address:
                                    </h6>
                                    <div className="field">
                                      <div className="control">
                                        <input
                                          name="secret"
                                          type="text"
                                          maxLength="42"
                                          placeholder="0x..."
                                          className="text-input text-input--large text-input--extended-extra is-marginless"
                                          pattern="^(0x)?[0-9a-fA-F]{40}$"
                                          onChange={this.handleTextInputChange}
                                        />
                                      </div>
                                      {(!this.secretValid() && this.state.secret !== '') ? <span className="help has-text-grey">Please enter a valid contract address</span> : null }
                                    </div>

                                    <div>
                                      <LoadingButton
                                        disabled={!this.formReady()}
                                        initialText='Submit Hint &amp; Secret'
                                        loadingText='Submitting'
                                        isLoading={this.state.coordinationGameStartHandler}
                                      />

                                      <br />
                                      <p className="help has-text-grey">
                                        <EtherFlip wei={this.props.weiPerApplication} /> to submit an application
                                      </p>
                                    </div>

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
                                    <br />
                                    <br />
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

                                  <span
                                    data-tip={this.props.waitingOnBlockToMine ? 'Please wait until the next block has mined' : ''}
                                    data-for={`register-request-verification-tooltip`}
                                  >
                                    <LoadingButton
                                      initialText='Request Verification'
                                      loadingText='Requesting'
                                      disabled={this.props.waitingOnBlockToMine}
                                      isLoading={this.state.coordinationGameSelectVerifierHandler}
                                    />
                                    <ReactTooltip
                                      id={`register-request-verification-tooltip`}
                                      html={true}
                                      wrapper='span'
                                    />
                                  </span>

                                  <br />
                                  <br />
                                </form>
                              )
                            }

                          </React.Fragment>
                        ) : (
                          null
                        )
                      }
                    </div>
                  </React.Fragment>

                ) : null }



                <br />
                <br />
                <div className="is-clearfix">
                  <h6 className="is-size-6">
                    Your Current Applications:
                  </h6>
                </div>
                <ApplicantApplicationsTable
                  currentPage={this.props.applicantApplicationsTableCurrentPage}
                />

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

                <Footer />
              </React.Fragment>
            )
          }
        }
      )
    )
  )
)
