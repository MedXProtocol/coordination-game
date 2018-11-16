import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { toastr } from '~/toastr'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import {
  TransactionStateHandler,
  withSend
} from 'saga-genesis'
import { LoadingButton } from '~/components/LoadingButton'
import { displayWeiToEther } from '~/utils/displayWeiToEther'

function mapStateToProps(state) {
  return {
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchShowLoadingStatus: () => {
      dispatch({ type: 'SHOW_LOADING_STATUS' })
    },
    dispatchHideLoadingStatus: () => {
      dispatch({ type: 'HIDE_LOADING_STATUS' })
    }
  }
}

export const VerifierStakeStep2 = connect(mapStateToProps, mapDispatchToProps)(
  withSend(
    class _VerifierStakeStep2 extends PureComponent {

      constructor(props) {
        super(props)
        this.state = {
        }
      }

      componentWillReceiveProps(nextProps) {
        this.registerWorkStakeHandlers(nextProps)
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

        this.props.dispatchShowLoadingStatus()
      }

      registerWorkStakeHandlers = (nextProps) => {
        if (this.state.workStakeHandler) {
          this.state.workStakeHandler.handle(
            nextProps.transactions[this.state.workStakeTxId]
          )
            .onError((error) => {
              this.props.dispatchHideLoadingStatus()

              console.log(error)
              this.setState({ workStakeHandler: null })
              toastr.transactionError(error)
            })
            .onConfirmed(() => {
              this.setState({ workStakeHandler: null })
              toastr.success('TEX Stake confirmed.')
            })
            .onTxHash(() => {
              this.props.dispatchHideLoadingStatus()

              toastr.success('TEX stake sent - it will take a few minutes to confirm on the Ethereum network.')
            })
        }
      }

      render() {
        let stakeCheckmark
        const { canStake, stakeComplete, requiredStake } = this.props

        if (!canStake()) { return null }

        if (stakeComplete()) {
          stakeCheckmark = (
            <React.Fragment>
              <FontAwesomeIcon icon={faCheckCircle} width="100" className="has-text-primary" />
            </React.Fragment>
          )
        }

        return (
          <React.Fragment>
            <h6 className="is-size-6">
              <span className="multistep-form--step-number">2.</span>
              Stake TEX {stakeCheckmark}
            </h6>

            <div className="columns">
              <div className="column is-8">
                <p>
                  You've successfully approved at least <strong>{displayWeiToEther(requiredStake)} TEX</strong>!
                  You can now stake that amount to become a Verifier.
                </p>
              </div>
            </div>

            <form onSubmit={this.handleSubmitStake}>
              <LoadingButton
                initialText='Stake'
                loadingText='Staking'
                isLoading={this.state.workStakeHandler}
              />
            </form>
          </React.Fragment>
        )
      }

    }
  )
)
