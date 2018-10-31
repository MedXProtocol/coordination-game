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
            txInFlight: false
          }
        }

        handleSubmitApproval = (e) => {
          e.preventDefault()

          const { send, workAddress, workTokenAddress, requiredStake } = this.props

          const workTokenApproveTxId = send(
            workTokenAddress,
            'approve',
            workAddress,
            etherToWei(requiredStake)
          )()

          this.setState({
            workTokenApproveHandler: new TransactionStateHandler(),
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
              <ScrollToTop />
              <PageTitle title='stake' />

              <div className="columns">
                <div className="column">
                  <h6 className="is-size-6">
                    Approve:
                  </h6>
                  {
                    weiToEther(this.props.tilwBalance) < 1 ? (
                      <p>
                        You need TILW before you can approve and stake.
                      </p>
                    ) : (
                      <form onSubmit={this.handleSubmitApproval}>
                        <button type="submit" className="button is-light">
                          Approve {displayWeiToEther(this.props.requiredStake)}
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
