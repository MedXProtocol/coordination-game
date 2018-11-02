import React, { Component } from 'react'
import { connect } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEthereum } from '@fortawesome/free-brands-svg-icons'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import classnames from 'classnames'
import { EtherscanLink } from '~/components/EtherscanLink'
import { txErrorMessage } from '~/services/txErrorMessage'
import { txErrorToCode } from '~/services/txErrorToCode'

const txNames = {
  'approve': 'TILW Approval',
  'start': 'Application Started',
  'applicantRandomlySelectVerifier': 'Requesting Verification',
  'depositStake': 'Depositing TILW Stake',
  'updateSettings': 'Update Settings',
  'verifierSubmitSecret': 'Submitting Secret'
}

function mapStateToProps(state) {
  let transactions = Object.entries(state.sagaGenesis.transactions)
  let pendingOrErrorTransactions = transactions.filter(transaction => {
    const { confirmed, error } = transaction[1]
    return (!confirmed && !error) ||
      (error && txErrorToCode(error) !== 'userRevert')
  })

  return {
    pendingOrErrorTransactions
  }
}

function mapDispatchToProps (dispatch) {
  return {
    dispatchSend: (transactionId, call, options, address) => {
      dispatch({ type: 'SEND_TRANSACTION', transactionId, call, options, address })
    },
    dispatchRemove: (transactionId) => {
      dispatch({ type: 'REMOVE_TRANSACTION', transactionId })
    }
  }
}

export const CurrentTransactionsList = connect(mapStateToProps, mapDispatchToProps)(
  class _CurrentTransactionsList extends Component {
    getClassName = (error, confirmed) => {
      let labelClass = ''

      if (error)
        labelClass = 'nav--circle__danger'
      else if (confirmed)
        labelClass = 'nav--circle__success'
      else
        labelClass = 'nav--circle__warning'

      return labelClass
    }

    getDropdownClassName = () => {
      let error = this.props.pendingOrErrorTransactions.find(tx => tx[1].error)
      let notConfirmed = this.props.pendingOrErrorTransactions.find(tx => !tx[1].confirmed)

      let dropdownClass = this.getClassName(error, !notConfirmed)

      return dropdownClass
    }

    getTransactionHtml = () => {
      let transactions = []
      let transactionHtml = null

      if (this.props.pendingOrErrorTransactions.length === 0) {
        transactionHtml = (
          <div className="blank-state">
            <div className="blank-state--inner text-center text-gray">
              Currently no ongoing transactions.
            </div>
          </div>
        )
      } else {
        transactions = this.props.pendingOrErrorTransactions.reverse().map(tx => {
          const key = tx[0]
          const { call, options, error, confirmed, gasUsed, address } = tx[1]
          const name = call.method
          const txHash = call.hash

          if (error) {
            if (gasUsed)
              options['gas'] = parseInt(1.2 * gasUsed, 10)

            var errorMessage = txErrorMessage(error)
            errorMessage = (
              <p className="small">
                {errorMessage}
              </p>
            )

            if (call.args) {
              var resendButton = (
                <React.Fragment>
                  {errorMessage ? null : <br />}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      this.props.dispatchSend(key, call, options, address)
                    }}
                  >
                    Retry
                  </button>
                </React.Fragment>
              )
              var removeButton = (
                <React.Fragment>
                  <button
                    className="btn-link text-gray"
                    onClick={(e) => {
                      e.preventDefault()
                      this.props.dispatchRemove(key)
                    }}
                  >
                    {'\u2716'}
                  </button>
                </React.Fragment>
              )
            }
          }

          return (
            <li
              key={`transaction-${key}`}
              className="nav-list--item"
            >
              <div className="nav-list--tx-wrapper">
                <span className={classnames(
                  'nav--circle',
                  'nav-list--tx-wrapper__child',
                  this.getClassName(error, confirmed)
                )} />
                <span className="nav-list--tx-name nav-list--tx-wrapper__child">
                  {txNames[name]}&nbsp;
                  <EtherscanLink txHash={txHash}>
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                  </EtherscanLink>
                </span>
              </div>
              {confirmed}
              {errorMessage}
              {resendButton}
              {removeButton}
            </li>
          )
        })

        transactionHtml = (
          <ul className="nav-list--group">
            {transactions}
          </ul>
        )
      }

      return transactionHtml
    }

    render () {
      return (
        <nav className="navbar navbar--txs">
          <div className="navbar-item has-dropdown is-hoverable">
            <button className="navbar-link has-text-transparent-white">
              <span className={classnames('nav--circle', this.getDropdownClassName())} />
              &nbsp;
                <FontAwesomeIcon icon={faEthereum} />
                &nbsp;
                Tx
            </button>

            <div className="navbar-dropdown">
              <span>
                {this.getTransactionHtml()}
              </span>
            </div>
          </div>
        </nav>
      )
    }
  }
)
