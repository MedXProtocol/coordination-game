import React, { Component } from 'react'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get } from 'lodash'
import {
  cacheCall,
  cacheCallValueInt,
  cacheCallValueBigNumber,
  contractByName,
  TransactionStateHandler,
  withSaga,
  withSend
} from 'saga-genesis'
import { toastr } from '~/toastr'
import { Footer } from '~/components/Footer'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { displayWeiToEther } from '~/utils/displayWeiToEther'
import { etherToWei } from '~/utils/etherToWei'

function mapStateToProps(state) {
  const transactions = get(state, 'sagaGenesis.transactions')
  const networkId = get(state, 'sagaGenesis.network.networkId')
  const address = get(state, 'sagaGenesis.accounts[0]')

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const powerChallengeAddress = contractByName(state, 'PowerChallenge')
  const workAddress = contractByName(state, 'Work')

  const applicationStakeAmount = cacheCallValueBigNumber(state, coordinationGameAddress, 'applicationStakeAmount')
  const baseApplicationFeeUsdWei = cacheCallValueBigNumber(state, coordinationGameAddress, 'baseApplicationFeeUsdWei')

  const verifierTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'verifierTimeoutInSeconds')
  const applicantRevealTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'applicantRevealTimeoutInSeconds')

  const powerChallengeTimeoutInSeconds = cacheCallValueInt(state, powerChallengeAddress, 'timeout')

  const jobStake = cacheCallValueBigNumber(state, workAddress, 'jobStake')
  const requiredStake = cacheCallValueBigNumber(state, workAddress, 'requiredStake')
  const minimumBalanceToWork = cacheCallValueBigNumber(state, workAddress, 'minimumBalanceToWork')

  return {
    address,
    applicationStakeAmount,
    applicantRevealTimeoutInSeconds,
    baseApplicationFeeUsdWei,
    coordinationGameAddress,
    networkId,
    jobStake,
    requiredStake,
    minimumBalanceToWork,
    powerChallengeTimeoutInSeconds,
    transactions,
    verifierTimeoutInSeconds,
    workAddress
  }
}

function* adminSaga({
  coordinationGameAddress,
  powerChallengeAddress,
  workAddress,
  address
}) {
  if (!coordinationGameAddress || !powerChallengeAddress || !workAddress || !address) { return null }

  yield all([
    cacheCall(workAddress, 'jobStake'),
    cacheCall(workAddress, 'requiredStake'),
    cacheCall(workAddress, 'minimumBalanceToWork'),
    cacheCall(coordinationGameAddress, 'applicationStakeAmount'),
    cacheCall(coordinationGameAddress, 'baseApplicationFeeUsdWei'),
    cacheCall(coordinationGameAddress, 'verifierTimeoutInSeconds'),
    cacheCall(coordinationGameAddress, 'applicantRevealTimeoutInSeconds'),
    cacheCall(powerChallengeAddress, 'timeout')
  ])
}

export const Admin = connect(mapStateToProps)(
  withSaga(adminSaga)(
    withSend(
      class _Admin extends Component {

        constructor(props) {
          super(props)
          this.state = {}
        }

        componentWillReceiveProps (nextProps) {
          this.registerCoordinationGameSettingsHandler(nextProps)
          this.registerPowerChallengeSettingsHandler(nextProps)
          this.registerWorkSettingsHandler(nextProps)
        }

        registerCoordinationGameSettingsHandler = (nextProps) => {
          if (this.state.coordinationGameSettingsHandler) {
            this.state.coordinationGameSettingsHandler.handle(
              nextProps.transactions[this.state.coordinationGameSettingsTxId]
            )
              .onError((error) => {
                this.setState({ coordinationGameSettingsHandler: null })
                toastr.transactionError(error)
              })
              .onConfirmed(() => {
                this.setState({ coordinationGameSettingsHandler: null })
                toastr.success('Coordination Game contract "Update Settings" confirmed.')
              })
              .onTxHash(() => {
                toastr.success('Coordination Game contract "Update Settings" sent successfully - it will take a few minutes to confirm on the Ethereum network.')
              })
          }
        }

        registerPowerChallengeSettingsHandler = (nextProps) => {
          if (this.state.powerChallengeSettingsHandler) {
            this.state.powerChallengeSettingsHandler.handle(
              nextProps.transactions[this.state.powerChallengeSettingsTxId]
            )
              .onError((error) => {
                this.setState({ powerChallengeSettingsHandler: null })
                toastr.transactionError(error)
              })
              .onConfirmed(() => {
                this.setState({ powerChallengeSettingsHandler: null })
                toastr.success('Power Challenge contract "Update Settings" confirmed.')
              })
              .onTxHash(() => {
                toastr.success('Power Challenge contract "Update Settings" sent successfully - it will take a few minutes to confirm on the Ethereum network.')
              })
          }
        }

        registerWorkSettingsHandler = (nextProps) => {
          if (this.state.workSettingsHandler) {
            this.state.workSettingsHandler.handle(
              nextProps.transactions[this.state.workSettingsTxId]
            )
              .onError((error) => {
                this.setState({ workSettingsHandler: null })
                toastr.transactionError(error)
              })
              .onConfirmed(() => {
                this.setState({ workSettingsHandler: null })
                toastr.success('Work contract "Update Settings" confirmed.')
              })
              .onTxHash(() => {
                toastr.success('Work contract "Update Settings" sent successfully - it will take a few minutes to confirm on the Ethereum network.')
              })
          }
        }

        handleSubmitCoordinationGameSettings = (e) => {
          e.preventDefault()

          const { send, coordinationGameAddress } = this.props

          const coordinationGameSettingsTxId = send(
            coordinationGameAddress,
            'updateSettings',
            this.newOrCurrentBigNumber('applicationStakeAmount'),
            this.newOrCurrentBigNumber('baseApplicationFeeUsdWei'),
            parseFloat(this.newOrCurrentValue('verifierTimeoutInSeconds')) * 86400,
            parseFloat(this.newOrCurrentValue('applicantRevealTimeoutInSeconds')) * 86400
          )()

          this.setState({
            coordinationGameSettingsHandler: new TransactionStateHandler(),
            coordinationGameSettingsTxId
          })
        }

        handleSubmitPowerChallengeSettings = (e) => {
          e.preventDefault()

          const { send, powerChallengeAddress } = this.props

          const powerChallengeSettingsTxId = send(
            powerChallengeAddress,
            'setTimeout',
            parseFloat(this.newOrCurrentValue('powerChallengeTimeoutInSeconds')) * 86400
          )()

          this.setState({
            powerChallengeSettingsHandler: new TransactionStateHandler(),
            powerChallengeSettingsTxId
          })
        }

        handleSubmitWorkSettings = (e) => {
          e.preventDefault()

          const { send, workAddress } = this.props

          const workSettingsTxId = send(
            workAddress,
            'updateSettings',
            this.newOrCurrentBigNumber('requiredStake'),
            this.newOrCurrentBigNumber('jobStake'),
            this.newOrCurrentBigNumber('minimumBalanceToWork')
          )()

          this.setState({
            workSettingsHandler: new TransactionStateHandler(),
            workSettingsTxId
          })
        }

        handleTextInputChange = (e) => {
          this.setState({
            [e.target.name]: e.target.value
          })
        }

        newOrCurrentBigNumber = (stateVar) => {
          return this.state[stateVar]
            ? etherToWei(this.state[stateVar])
            : this.props[stateVar]
        }

        newOrCurrentValue = (stateVar) => {
          return this.state[stateVar]
            ? this.state[stateVar]
            : this.props[stateVar]
        }

        render() {
          return (
            <div>
              <PageTitle title='admin' />
              <ScrollToTop />

              <h1 className="is-size-1">
                Admin Settings
              </h1>

              <h4 className="is-size-4 has-text-grey">
                Coordination Game Contract
              </h4>

              <form onSubmit={this.handleSubmitCoordinationGameSettings}>
                <div className="columns">
                  <div className="column is-6">
                    <p className="is-size-7">
                      <strong>TIL Application Stake Amount</strong>
                      <span className="is-size-7 is-block has-text-grey">(in TEX)</span>
                    </p>
                    <input
                      type="text"
                      name="applicationStakeAmount"
                      className="text-input is-marginless text-input--large text-input--extended-extra"
                      onChange={this.handleTextInputChange}
                      value={this.state.applicationStakeAmount || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {displayWeiToEther(this.props.applicationStakeAmount)}
                    </span>
                  </div>

                  <div className="column is-6">
                    <p className="is-size-7">
                      <strong>TIL Application Fee</strong>
                      <span className="is-size-7 is-block has-text-grey">(in USD)</span>
                    </p>
                    <input
                      type="text"
                      name="baseApplicationFeeUsdWei"
                      className="text-input is-marginless text-input--large text-input--extended-extra"
                      onChange={this.handleTextInputChange}
                      value={this.state.baseApplicationFeeUsdWei || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {displayWeiToEther(this.props.baseApplicationFeeUsdWei)}
                    </span>
                  </div>
                </div>

                <div className="columns">
                  <div className="column is-6">
                    <p className="is-size-7">
                      <strong>Verifier Timeout</strong>
                      <span className="is-size-7 is-block has-text-grey">(in days)</span>
                    </p>
                    <input
                      type="text"
                      name="verifierTimeoutInSeconds"
                      className="text-input is-marginless text-input--large text-input--extended-extra"
                      onChange={this.handleTextInputChange}
                      value={this.state.verifierTimeoutInSeconds || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {this.props.verifierTimeoutInSeconds / 86400}
                    </span>
                  </div>

                  <div className="column is-6">
                    <p className="is-size-7">
                      <strong>Applicant Reveal Timeout</strong>
                      <span className="is-size-7 is-block has-text-grey">(in days)</span>
                    </p>
                    <input
                      type="text"
                      name="applicantRevealTimeoutInSeconds"
                      className="text-input is-marginless text-input--large text-input--extended-extra"
                      onChange={this.handleTextInputChange}
                      value={this.state.applicantRevealTimeoutInSeconds || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {this.props.applicantRevealTimeoutInSeconds / 86400}
                    </span>
                  </div>
                </div>

                <div className="is-clearfix">
                  <button
                    disabled={this.state.coordinationGameSettingsHandler}
                    className={classnames(
                      'button',
                      'is-primary',
                      'is-small',
                      'is-outlined',
                      'is-pulled-right',
                      {
                        'is-loading': this.state.coordinationGameSettingsHandler
                      }
                    )}
                  >
                    Save Coordination Game Settings
                  </button>
                </div>
              </form>

              <hr />

              <h4 className="is-size-4 has-text-grey">
                Power Challenge Contract
              </h4>

              <form onSubmit={this.handleSubmitPowerChallengeSettings}>
                <div className="columns">
                  <div className="column is-6">
                    <p className="is-size-7">
                      <strong>Challenge Round Duration</strong>
                      <span className="is-size-7 is-block has-text-grey">(in days)</span>
                    </p>
                    <input
                      type="text"
                      name="powerChallengeTimeoutInSeconds"
                      className="text-input is-marginless text-input--large text-input--extended-extra"
                      onChange={this.handleTextInputChange}
                      value={this.state.powerChallengeTimeoutInSeconds || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {this.props.powerChallengeTimeoutInSeconds / 86400}
                    </span>
                  </div>
                </div>

                <div className="is-clearfix">
                  <button
                    disabled={this.state.powerChallengeSettingsHandler}
                    className={classnames(
                      'button',
                      'is-primary',
                      'is-small',
                      'is-outlined',
                      'is-pulled-right',
                      {
                        'is-loading': this.state.powerChallengeSettingsHandler
                      }
                    )}
                  >
                    Save Power Challenge Settings
                  </button>
                </div>
              </form>

              <hr />

              <form onSubmit={this.handleSubmitWorkSettings}>
                <h4 className="is-size-4 has-text-grey">
                  Work Contract
                </h4>

                <div className="columns">
                  <div className="column is-4">
                    <p className="is-size-7">
                      <strong>Verification Job Stake Amount</strong>
                      <span className="is-size-7 is-block has-text-grey">(in TEX)</span>
                    </p>
                    <input
                      type="text"
                      name="jobStake"
                      className="text-input is-marginless text-input--large text-input--extended-extra"
                      onChange={this.handleTextInputChange}
                      value={this.state.jobStake || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {displayWeiToEther(this.props.jobStake)}
                    </span>
                  </div>

                  <div className="column is-4">
                    <p className="is-size-7">
                      <strong>Required Stake Amount</strong>
                      <span className="is-size-7 is-block has-text-grey">(in TEX)</span>
                    </p>
                    <input
                      type="text"
                      name="requiredStake"
                      className="text-input is-marginless text-input--large text-input--extended-extra"
                      onChange={this.handleTextInputChange}
                      value={this.state.requiredStake || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {displayWeiToEther(this.props.requiredStake)}
                    </span>
                  </div>

                  <div className="column is-4">
                    <p className="is-size-7">
                      <strong>Minimum Balance</strong>
                      <span className="is-size-7 is-block has-text-grey">(in TEX)</span>
                    </p>
                    <input
                      type="text"
                      name="minimumBalanceToWork"
                      className="text-input is-marginless text-input--large text-input--extended-extra"
                      onChange={this.handleTextInputChange}
                      value={this.state.minimumBalanceToWork || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {displayWeiToEther(this.props.minimumBalanceToWork)}
                    </span>
                  </div>
                </div>

                <div className="is-clearfix">
                  <button
                    disabled={this.state.workSettingsHandler}
                    className={classnames(
                      'button',
                      'is-primary',
                      'is-small',
                      'is-outlined',
                      'is-pulled-right',
                      {
                        'is-loading': this.state.workSettingsHandler
                      }
                    )}
                  >
                    Save Work Settings
                  </button>
                </div>
              </form>

              <Footer />
            </div>
          )
        }
      }
    )
  )
)
