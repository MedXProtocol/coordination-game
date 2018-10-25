import React, { Component } from 'react'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get } from 'lodash'
import { InfoQuestionMark } from '~/components/InfoQuestionMark'
import {
  cacheCall,
  cacheCallValueBigNumber,
  contractByName,
  TransactionStateHandler,
  withSaga,
  withSend
} from 'saga-genesis'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { displayWeiToEther } from '~/utils/displayWeiToEther'
import { etherToWei } from '~/utils/etherToWei'
import { weiToEther } from '~/utils/weiToEther'

function mapStateToProps(state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const transactions = get(state, 'sagaGenesis.transactions')
  const workAddress = contractByName(state, 'Work')
  const workTokenAddress = contractByName(state, 'WorkToken')
  const tilwBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)

  const allowance = cacheCallValueBigNumber(state, workTokenAddress, 'allowance', address, workAddress)
  const staked = cacheCallValueBigNumber(state, workAddress, 'balances', address)

  const requiredStake = cacheCallValueBigNumber(state, workAddress, 'requiredStake')
  const jobStake = cacheCallValueBigNumber(state, workAddress, 'jobStake')
  const stakeLimit = cacheCallValueBigNumber(state, workAddress, 'stakeLimit')

  return {
    address,
    allowance,
    jobStake,
    requiredStake,
    staked,
    stakeLimit,
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
    cacheCall(workAddress, 'jobStake'),
    cacheCall(workAddress, 'requiredStake'),
    cacheCall(workAddress, 'stakeLimit')
  ])
}

export const VerifierStake = connect(mapStateToProps)(
  withSend(
    withSaga(verifierStakeSaga)(
      class _VerifierStake extends Component {

        constructor(props) {
          super(props)
          this.state = {
            amountToApprove: 0,
            txInFlight: false
          }
        }

        setAmountToStake = (percentage) => {
          const calculatedAmount = (
            weiToEther(this.props.tilwBalance) * (percentage / 100)
          )

          this.setState({
            amountToApprove: calculatedAmount
          })
        }

        handleSubmitApproval = (e) => {
          e.preventDefault()

          const { send, workAddress, workTokenAddress } = this.props

          const workTokenApproveTxId = send(
            workTokenAddress,
            'approve',
            workAddress,
            etherToWei(this.state.amountToApprove)
          )()

          // also need to approve coordinationGameAddress !
          // wt.approve(coordinationGameAddress, minDeposit, { from: applicant })

          this.setState({
            amountToApprove: 0,
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
          console.log(e.target.name)
          console.log(e.target.value)
          this.setState({
            [e.target.name]: e.target.value
          })
        }

        render() {
          return (
            <div>
              <ScrollToTop />
              <PageTitle title='stake' />

              <div className="level--container">
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
                      <p className="heading">
                        Balance
                      </p>
                      <p className="title">
                        {displayWeiToEther(this.props.tilwBalance)}
                      </p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">
                        Approved
                      </p>
                      <p className="title">
                        {displayWeiToEther(this.props.allowance)}
                      </p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">
                        Staked <InfoQuestionMark
                          name="stake-limit"
                          place="left"
                          tooltipText={`The current stake limit is: ${displayWeiToEther(this.props.stakeLimit)}`}
                        />
                      </p>
                      <p className="title">
                        {displayWeiToEther(this.props.staked)}
                      </p>
                    </div>
                  </div>
                </nav>

                <nav className="level level--footer">
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">
                        Required Stake:
                      </p>
                      <p className="title">
                        {displayWeiToEther(this.props.requiredStake)}
                      </p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">
                        Job Stake Amount:
                      </p>
                      <p className="title">
                        {displayWeiToEther(this.props.jobStake)}
                      </p>
                    </div>
                  </div>
                  <div className="level-item has-text-centered">
                    <div>
                      <p className="heading">
                        Stake limit:
                      </p>
                      <p className="title">
                        {displayWeiToEther(this.props.stakeLimit)}
                      </p>
                    </div>
                  </div>
                </nav>
              </div>

              <br />

              <div className="columns">
                <div className="column">
                  <h6 className="is-size-6">
                    Amount to Approve:
                  </h6>
                  {
                    weiToEther(this.props.tilwBalance) < 1 ? (
                      <p>
                        You need TILW before you can approve and stake.
                      </p>
                    ) : (
                      <form onSubmit={this.handleSubmitApproval}>
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
                          name="amountToApprove"
                          className="text-input"
                          placeholder="100"
                          onChange={this.handleTextInputChange}
                          value={this.state.amountToApprove}
                        />
                        <br />

                        <button type="submit" className="button is-light">
                          Approve
                        </button>
                      </form>
                    )
                  }
                </div>
                <div className="column">
                  <h6 className="is-size-6">
                    Stake:
                  </h6>
                  <form onSubmit={this.handleSubmitStake}>
                    {
                      weiToEther(this.props.tilwBalance) < 1 ? (
                        <p>
                          You need TILW before you can approve and stake.
                        </p>
                      ) : (
                        <React.Fragment>
                          <p>
                            Current stake amount is: {displayWeiToEther(this.props.requiredStake)}
                          </p>
                          <br />

                          <button type="submit" className="button is-light">
                            Stake {displayWeiToEther(this.props.requiredStake)}
                          </button>
                        </React.Fragment>
                      )
                    }
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
