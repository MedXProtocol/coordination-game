import React, { Component } from 'react'
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
import { displayWeiToEther } from '~/utils/displayWeiToEther'
import { getWeb3 } from '~/utils/getWeb3'

function mapStateToProps(state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const transactions = get(state, 'sagaGenesis.transactions')
  const workAddress = contractByName(state, 'Work')
  const workTokenAddress = contractByName(state, 'WorkToken')
  const tilwBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

  const allowance = cacheCallValueBigNumber(state, workTokenAddress, 'allowance', address, workAddress)
  const staked = cacheCallValueBigNumber(state, workAddress, 'balances', address)
  const requiredStake = cacheCallValueBigNumber(state, workAddress, 'requiredStake')

  return {
    address,
    allowance,
    requiredStake,
    staked,
    transactions,
    tilwBalance,
    workAddress,
    workTokenAddress
  }
}

function* verifierStakeSaga({ address, workTokenAddress, workAddress }) {
  if (!address || !workTokenAddress || !workAddress) { return }

  yield all([
    cacheCall(workTokenAddress, 'balanceOf', address),
    cacheCall(workTokenAddress, 'allowance', address, workAddress),
    cacheCall(workAddress, 'balances', address),
    cacheCall(workAddress, 'requiredStake')
  ])
}

export const VerifierStake = connect(mapStateToProps)(
  withSend(
    withSaga(verifierStakeSaga)(
      class _VerifierStake extends Component {

        constructor(props) {
          super(props)
          this.state = {
            amountToStake: 0,
            txInFlight: false
          }
        }

        setAmountToStake = (percentage) => {
          const calculatedAmount = this.props.tilwBalance * (percentage / 100)

          this.setState({
            amountToStake: calculatedAmount
          })
        }

        handleSubmitApproval = (e) => {
          e.preventDefault()

          const { send, workAddress, workTokenAddress } = this.props

          const workTokenApproveTxId = send(
            workTokenAddress,
            'approve',
            workAddress,
            this.state.amountToStake
          )()

          this.setState({
            workTokenStartHandler: new TransactionStateHandler(),
            workTokenApproveTxId
          })
        }

        handleSubmitStake = (e) => {
          e.preventDefault()

          const { send, workAddress } = this.props

          const workStakeTxId = send(
            workAddress,
            'depositStake'
          )()

          this.setState({
            workStakeHandler: new TransactionStateHandler(),
            workStakeTxId
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
              <PageTitle title='stake' />

              <nav className="level">
                <p className="level-item has-text-centered">
                  <span className="title">
                    TILW
                  </span>
                </p>
              </nav>
              <nav className="level">
                <div className="level-item has-text-centered">
                  <div>
                    <p className="heading">Balance</p>
                    <p className="title">{displayWeiToEther(this.props.tilwBalance)}</p>
                  </div>
                </div>
                <div className="level-item has-text-centered">
                  <div>
                    <p className="heading">Approved</p>
                    <p className="title">{displayWeiToEther(this.props.allowance)}</p>
                  </div>
                </div>
                <div className="level-item has-text-centered">
                  <div>
                    <p className="heading">Staked</p>
                    <p className="title">{displayWeiToEther(this.props.staked)}</p>
                  </div>
                </div>
              </nav>
              <hr />

              <br />


              <div className="columns">
                <div className="column">
                  <form onSubmit={this.handleSubmitApproval}>
                    <h5 className="is-size-5">
                      Amount to Approve:
                    </h5>
                    <div className="columns columns--is-button-container">
                      <div className="column is-narrow">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            this.setAmountToStake(0)
                          }}
                          className="button is-light is-small button--amount-to-stake"
                        >
                          0%
                        </button>
                      </div>
                      <div className="column is-narrow">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            this.setAmountToStake(25)
                          }}
                          className="button is-light is-small button--amount-to-stake"
                        >
                          25%
                        </button>
                      </div>
                      <div className="column is-narrow">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            this.setAmountToStake(50)
                          }}
                          className="button is-light is-small button--amount-to-stake"
                        >
                          50%
                        </button>
                      </div>
                      <div className="column is-narrow">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            this.setAmountToStake(75)
                          }}
                          className="button is-light is-small button--amount-to-stake"
                        >
                          75%
                        </button>
                      </div>
                      <div className="column is-narrow">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            this.setAmountToStake(100)
                          }}
                          className="button is-light is-small button--amount-to-stake"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    <input
                      name="amountToStake"
                      className="text-input"
                      placeholder="100"
                      onChange={this.handleTextInputChange}
                      value={displayWeiToEther(this.state.amountToStake)}
                    />
                    <br />

                    <button type="submit" className="button is-light">
                      Approve
                    </button>
                  </form>
                </div>
                <div className="column">
                  <form onSubmit={this.handleSubmitStake}>
                    <h5 className="is-size-5">
                      Stake:
                    </h5>

                    <p>
                      Current stake amount is: {displayWeiToEther(this.props.requiredStake)}
                    </p>
                    <br />

                    <button type="submit" className="button is-light">
                      Stake {displayWeiToEther(this.props.requiredStake)}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )
        }
      }
    )
  )
)
