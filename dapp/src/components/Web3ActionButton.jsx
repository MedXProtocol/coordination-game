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

export const Web3ActionButton = connect(mapStateToProps)(
  withSend(
    class _Web3ActionButton extends Component {

      static propTypes = {
        contractAddress: PropTypes.string.isRequired,
        method: PropTypes.string.isRequired,
        args: PropTypes.array.isRequired,
        buttonText: PropTypes.string.isRequired,
        loadingText: PropTypes.string,
        confirmationMessage: PropTypes.string,
        txHashMessage: PropTypes.string
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
              this.setState({ txHandler: null })
              toastr.transactionError(error)
            })
            .onConfirmed(() => {
              this.setState({ txHandler: null })
              toastr.success(nextProps.confirmationMessage)
            })
            .onTxHash(() => {
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
              className={this.props.className}
            />
          </form>
        )
      }

    }
  )
)
