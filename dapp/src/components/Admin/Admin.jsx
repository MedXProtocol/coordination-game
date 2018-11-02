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

  const jobStake = cacheCallValueBigNumber(state, workAddress, 'jobStake')
  const requiredStake = cacheCallValueBigNumber(state, workAddress, 'requiredStake')

  return {
    address,
    applicationStakeAmount,
    coordinationGameAddress,
    networkId,
    jobStake,
    requiredStake,
    transactions,
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
    cacheCall(coordinationGameAddress, 'applicationStakeAmount')
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

          const newApplicationStakeAmount = this.state.applicationStakeAmount
            ? etherToWei(this.state.applicationStakeAmount)
            : this.props.applicationStakeAmount

          const coordinationGameSettingsTxId = send(
            coordinationGameAddress,
            'updateSettings',
            newApplicationStakeAmount
          )()

          this.setState({
            coordinationGameSettingsHandler: new TransactionStateHandler(),
            coordinationGameSettingsTxId
          })
        }

        handleSubmitWorkSettings = (e) => {
          e.preventDefault()

          const { send, workAddress } = this.props

          const newRequiredStake = this.state.requiredStake
            ? etherToWei(this.state.requiredStake)
            : this.props.requiredStake
          const newJobStake = this.state.jobStake
            ? etherToWei(this.state.jobStake)
            : this.props.jobStake

          const workSettingsTxId = send(
            workAddress,
            'updateSettings',
            newRequiredStake,
            newJobStake
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