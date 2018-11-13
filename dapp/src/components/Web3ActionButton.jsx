import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import {
  TransactionStateHandler,
  withSend
} from 'saga-genesis'
import { get } from 'lodash'
import { toastr } from '~/toastr'
import { LoadingButton } from '~/components/LoadingButton'

function mapStateToProps(state) {
  const transactions = get(state, 'sagaGenesis.transactions')

  return {
    transactions
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

export const Web3ActionButton = connect(mapStateToProps, mapDispatchToProps)(
  withSend(
    class _Web3ActionButton extends Component {

      static propTypes = {
        contractAddress: PropTypes.string.isRequired,
        method: PropTypes.string.isRequired,
        args: PropTypes.array.isRequired,
        buttonText: PropTypes.string.isRequired,
        loadingText: PropTypes.string.isRequired,
        confirmationMessage: PropTypes.string.isRequired,
        txHashMessage: PropTypes.string.isRequired,
        isSmall: PropTypes.bool
      }

      constructor(props) {
        super(props)

        this.state = {
          txHandler: undefined
        }
      }

      componentWillReceiveProps (nextProps) {
        this.registerTxHandlers(nextProps)
      }

      registerTxHandlers = (nextProps) => {
        if (this.state.txHandler) {
          this.state.txHandler.handle(
            nextProps.transactions[this.state.txId]
          )
            .onError((error) => {
              this.props.dispatchHideLoadingStatus()
              this.setState({ txHandler: null })
              toastr.transactionError(error)
            })
            .onConfirmed(() => {
              this.setState({ txHandler: null })
              toastr.success(nextProps.confirmationMessage)
            })
            .onTxHash(() => {
              this.props.dispatchHideLoadingStatus()
              toastr.success(nextProps.txHashMessage)
            })
        }
      }

      handleSend = (e) => {
        e.preventDefault()

        const { send, contractAddress, method, args } = this.props
        console.log(...args)

        const txId = send(
          contractAddress,
          method,
          ...args
        )()
        console.log(`Making call to ${contractAddress}#${method} with args`, args)
        // console.log('txid is: ', txId)


        this.setState({
          txHandler: new TransactionStateHandler(),
          txId
        })

        this.props.dispatchShowLoadingStatus()
      }

      render() {
        const { buttonText, contractAddress, loadingText, isSmall } = this.props

        return (
          <form onSubmit={this.handleSend}>
            <LoadingButton
              initialText={buttonText}
              loadingText={loadingText}
              isLoading={this.state.txHandler}
              isSmall={isSmall}
              disabled={!contractAddress || this.state.txHandler}
            />
          </form>
        )
      }

    }
  )
)
