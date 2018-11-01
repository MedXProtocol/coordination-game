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

  const requiredStake = cacheCallValueBigNumber(state, workAddress, 'requiredStake')

  return {
    address,
    applicationStakeAmount,
    coordinationGameAddress,
    networkId,
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
          console.log(nextProps.transactions)
          this.registerCoordinationGameSettingsHandler(nextProps)
          this.registerWorkSettingsHandler(nextProps)
        }

        registerCoordinationGameSettingsHandler = (nextProps) => {
          if (this.state.coordinationGameSettingsHandler) {
            this.state.coordinationGameSettingsHandler.handle(
              nextProps.transactions[this.state.coordinationGameSettingsTxId]
            )
              .onError((error) => {
                console.log(error)
                this.setState({ coordinationGameSettingsHandler: null })
                toastr.transactionError(error)
              })
              .onConfirmed(() => {
                // TODO: Why are we not gettin in here? Seems like
                //       props.transactions[this.state.coordinationGameSettingsTxId]
                //       never gets confirmations

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
            console.log('inside')
            this.state.workSettingsHandler.handle(
              nextProps.transactions[this.state.workSettingsTxId]
            )
              .onError((error) => {
                console.log(error)
                this.setState({ workSettingsHandler: null })
                toastr.transactionError(error)
              })
              .onConfirmed(() => {
                // TODO: Why are we not gettin in here? Seems like
                //       props.transactions[this.state.workSettingsTxId]
                //       never gets confirmations
                console.log('conffff')
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

          const workSettingsTxId = send(
            workAddress,
            'updateSettings',
            newRequiredStake
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
                <h6 className="is-size-6">
                  Application Stake Amount
                </h6>
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

                <h6 className="is-size-6">
                  Required Stake
                </h6>
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
