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

  return {
    address,
    transactions,
    tilwBalance,
    workAddress,
    workTokenAddress
  }
}

function* verifierStakeSaga({ workTokenAddress, address }) {
  if (!workTokenAddress || !address) { return }

  yield all([
    cacheCall(workTokenAddress, 'balanceOf', address)
  ])
}

export const VerifierStake = withSaga(verifierStakeSaga)(
  withSend(
    connect(mapStateToProps)(
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

        handleSubmit = (e) => {
          e.preventDefault()

          const { send, workAddress, workTokenAddress } = this.props

          // await workToken.approve(work.address, workStake, { from: address })
          // await work.depositStake({ from: address })
          const workTokenApproveTxId = send(
            workTokenAddress,
            'approve',
            workAddress,
            this.state.amountToStake
          )()
          // await workToken.approve(work.address, workStake, { from: address })
          // await work.depositStake({ from: address })

          this.setState({
            workTokenStartHandler: new TransactionStateHandler(),
            workTokenApproveTxId
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
                    <p className="heading">Amount Staked</p>
                    <p className="title">0</p>
                  </div>
                </div>
              </nav>
              <hr />

              <br />
              <form onSubmit={this.handleSubmit}>

                <h5 className="is-size-5">
                  Amount to Stake:
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
                  Stake Tokens
                </button>

              </form>
            </div>
          )
        }
      }
    )
  )
)
