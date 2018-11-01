import React, { Component } from 'react'
import { connect } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import { toastr } from '~/toastr'
import {
  TransactionStateHandler,
  withSend
} from 'saga-genesis'
import { LoadingLines } from '~/components/LoadingLines'
import { displayWeiToEther } from '~/utils/displayWeiToEther'

function mapStateToProps(state) {
  return {
  }
}

export const VerifierStakeStep1 = connect(mapStateToProps)(
  withSend(
    class _VerifierStakeStep1 extends Component {

      constructor(props) {
        super(props)
        this.state = {
        }
      }

      componentWillReceiveProps(nextProps) {
        this.registerWorkTokenApproveHandlers(nextProps)
      }

      handleSubmitApproval = (e) => {
        e.preventDefault()

        const { send, workAddress, workTokenAddress, requiredStake } = this.props

        const workTokenApproveTxId = send(
          workTokenAddress,
          'approve',
          workAddress,
          requiredStake
        )()

        this.setState({
          workTokenApproveHandler: new TransactionStateHandler(),
          workTokenApproveTxId
        })
      }

      registerWorkTokenApproveHandlers = (nextProps) => {
        if (this.state.workTokenApproveHandler) {
          this.state.workTokenApproveHandler.handle(
            nextProps.transactions[this.state.workTokenApproveTxId]
          )
            .onError((error) => {
              console.log(error)
              this.setState({ workTokenApproveHandler: null })
              toastr.transactionError(error)
            })
            .onConfirmed(() => {
              this.setState({ workTokenApproveHandler: null })
              toastr.success('Approval for contract to spend TILW tokens confirmed.')
            })
            .onTxHash(() => {
              toastr.success('Approval for contract to spend TILW tokens sent - it will take a few minutes to confirm on the Ethereum network.')
            })
        }
      }

      render() {
        let approvalCheckmark, step1
        const { approvalComplete, canApprove, requiredStake } = this.props

        if (approvalComplete()) {
          approvalCheckmark = (
            <React.Fragment>
              <FontAwesomeIcon icon={faCheckCircle} width="100" className="has-text-primary" />
            </React.Fragment>
          )
        }

        if (canApprove() && !approvalComplete()) {
          step1 = (
            <React.Fragment>
              <div className="columns">
                <div className="column is-8">
                  <p>
                    The Trustless Incentivized List contract needs your permission to stake <strong>{displayWeiToEther(requiredStake)} TILW</strong> to become a verifier.
                  </p>
                </div>
              </div>

              <form onSubmit={this.handleSubmitApproval}>
                <button type="submit" className="button is-primary is-outlined">
                  Approve
                </button>
                <LoadingLines
                  visible={this.state.workTokenApproveHandler}
                />
              </form>
            </React.Fragment>
          )
        }

        return (
          <React.Fragment>
            <h6 className="is-size-6">
              <span className="multistep-form--step-number">1.</span>
              Approve TILW {approvalCheckmark}
            </h6>

            {step1}
          </React.Fragment>
        )
      }

    }
  )
)
