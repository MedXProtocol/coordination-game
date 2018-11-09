import React, { Component } from 'react'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get } from 'lodash'
import {
  cacheCall,
  cacheCallValueBigNumber,
  contractByName,
  TransactionStateHandler,
  withSaga,
  withSend
} from 'saga-genesis'
import { toastr } from '~/toastr'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { displayWeiToEther } from '~/utils/displayWeiToEther'
import { etherToWei } from '~/utils/etherToWei'

function mapStateToProps(state) {
  const transactions = get(state, 'sagaGenesis.transactions')
  const networkId = get(state, 'sagaGenesis.network.networkId')
  const address = get(state, 'sagaGenesis.accounts[0]')

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const workAddress = contractByName(state, 'Work')

  const applicationStakeAmount = cacheCallValueBigNumber(state, coordinationGameAddress, 'applicationStakeAmount')
  const baseApplicationFeeUsdWei = cacheCallValueBigNumber(state, coordinationGameAddress, 'baseApplicationFeeUsdWei')

  const secondsInADay = cacheCallValueBigNumber(state, coordinationGameAddress, 'secondsInADay')
  const verifierTimeoutInDays = cacheCallValueBigNumber(state, coordinationGameAddress, 'verifierTimeoutInDays')
  const applicantRevealTimeoutInDays = cacheCallValueBigNumber(state, coordinationGameAddress, 'applicantRevealTimeoutInDays')

  const jobStake = cacheCallValueBigNumber(state, workAddress, 'jobStake')
  const requiredStake = cacheCallValueBigNumber(state, workAddress, 'requiredStake')

  return {
    address,
    applicationStakeAmount,
    applicantRevealTimeoutInDays,
    baseApplicationFeeUsdWei,
    coordinationGameAddress,
    networkId,
    jobStake,
    requiredStake,
    secondsInADay,
    transactions,
    verifierTimeoutInDays,
    workAddress
  }
}

function* adminSaga({
  coordinationGameAddress,
  workAddress,
  address
}) {
  if (!coordinationGameAddress || !workAddress || !address) { return null }

  yield all([
    cacheCall(workAddress, 'jobStake'),
    cacheCall(workAddress, 'requiredStake'),
    cacheCall(coordinationGameAddress, 'applicationStakeAmount'),
    cacheCall(coordinationGameAddress, 'baseApplicationFeeUsdWei'),
    cacheCall(coordinationGameAddress, 'secondsInADay'),
    cacheCall(coordinationGameAddress, 'verifierTimeoutInDays'),
    cacheCall(coordinationGameAddress, 'applicantRevealTimeoutInDays')
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
                // TODO: Why are we not gettin in here? Seems like
                //       props.transactions[this.state.workSettingsTxId]
                //       never gets confirmations
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
            this.newOrCurrentValue('applicationStakeAmount'),
            this.newOrCurrentValue('baseApplicationFeeUsdWei'),
            this.newOrCurrentValue('secondsInADay'),
            this.newOrCurrentValue('verifierTimeoutInDays'),
            this.newOrCurrentValue('applicantRevealTimeoutInDays')
          )()

          this.setState({
            coordinationGameSettingsHandler: new TransactionStateHandler(),
            coordinationGameSettingsTxId
          })
        }

        handleSubmitWorkSettings = (e) => {
          e.preventDefault()

          const { send, workAddress } = this.props

          const workSettingsTxId = send(
            workAddress,
            'updateSettings',
            this.newOrCurrentValue('requiredStake'),
            this.newOrCurrentValue('jobStake')
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

        newOrCurrentValue = (stateVar) => {
          return this.state[stateVar]
            ? etherToWei(this.state[stateVar])
            : this.props[stateVar]
        }

        render() {
          return (
            <div>
              <PageTitle title='apply' />
              <ScrollToTop />

              <h1 className="is-size-1">
                Admin Settings
              </h1>

              <h4 className="is-size-4 has-text-grey">
                Coordination Game Contract
              </h4>

              <form onSubmit={this.handleSubmitCoordinationGameSettings}>
                <div className="columns">
                  <div className="column is-4">
                    <p className="is-size-7">
                      <strong>TIL Application Stake Amount</strong>
                      <span className="is-size-7 is-block has-text-grey">(in TILW)</span>
                    </p>
                    <input
                      type="text"
                      name="applicationStakeAmount"
                      className="text-input is-marginless"
                      onChange={this.handleTextInputChange}
                      value={this.state.applicationStakeAmount || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {displayWeiToEther(this.props.applicationStakeAmount)}
                    </span>
                  </div>

                  <div className="column is-4">
                    <p className="is-size-7">
                      <strong>TIL Application Fee</strong>
                      <span className="is-size-7 is-block has-text-grey">(in USD)</span>
                    </p>
                    <input
                      type="text"
                      name="baseApplicationFeeUsdWei"
                      className="text-input is-marginless"
                      onChange={this.handleTextInputChange}
                      value={this.state.baseApplicationFeeUsdWei || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {displayWeiToEther(this.props.baseApplicationFeeUsdWei)}
                    </span>
                  </div>
                </div>

                <div className="columns">
                  <div className="column is-4">
                    <p className="is-size-7">
                      <strong>Seconds in a Day</strong>
                      <span className="is-size-7 is-block has-text-grey">(default is 86,400)</span>
                    </p>
                    <input
                      type="text"
                      name="secondsInADay"
                      className="text-input is-marginless"
                      onChange={this.handleTextInputChange}
                      value={this.state.secondsInADay || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {this.props.secondsInADay}
                    </span>
                  </div>

                  <div className="column is-4">
                    <p className="is-size-7">
                      <strong>Verifier Timeout</strong>
                      <span className="is-size-7 is-block has-text-grey">(in days)</span>
                    </p>
                    <input
                      type="text"
                      name="verifierTimeoutInDays"
                      className="text-input is-marginless"
                      onChange={this.handleTextInputChange}
                      value={this.state.verifierTimeoutInDays || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {this.props.verifierTimeoutInDays}
                    </span>
                  </div>

                  <div className="column is-4">
                    <p className="is-size-7">
                      <strong>Applicant Reveal Timeout</strong>
                      <span className="is-size-7 is-block has-text-grey">(in days)</span>
                    </p>
                    <input
                      type="text"
                      name="applicantRevealTimeoutInDays"
                      className="text-input is-marginless"
                      onChange={this.handleTextInputChange}
                      value={this.state.applicantRevealTimeoutInDays || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {this.props.applicantRevealTimeoutInDays}
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

              <form onSubmit={this.handleSubmitWorkSettings}>
                <h4 className="is-size-4 has-text-grey">
                  Work Contract
                </h4>

                <div className="columns">
                  <div className="column is-4">
                    <p className="is-size-7">
                      <strong>Verification Job Stake Amount</strong>
                      <span className="is-size-7 is-block has-text-grey">(in TILW)</span>
                    </p>
                    <input
                      type="text"
                      name="jobStake"
                      className="text-input is-marginless"
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
                      <span className="is-size-7 is-block has-text-grey">(in TILW)</span>
                    </p>
                    <input
                      type="text"
                      name="requiredStake"
                      className="text-input is-marginless"
                      onChange={this.handleTextInputChange}
                      value={this.state.requiredStake || ''}
                    />
                    <span className="help has-text-grey">
                      Currently: {displayWeiToEther(this.props.requiredStake)}
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
            </div>
          )
        }
      }
    )
  )
)
