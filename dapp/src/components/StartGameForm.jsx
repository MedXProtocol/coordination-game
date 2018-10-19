import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import BN from 'bn.js'
import {
  contractByName,
  withSend,
  TransactionStateHandler
} from 'saga-genesis'
import { toastr } from '~/toastr'
import { getWeb3 } from '~/utils/getWeb3'

function mapStateToProps(state) {
  const transactions = get(state, 'sagaGenesis.transactions')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameInstance = contractByName(state, 'CoordinationGame')

  return {
    transactions,
    address,
    coordinationGameInstance
  }
}

export const StartGameFormContainer = connect(mapStateToProps)(
  withSend(
    class _StartGameForm extends Component {

      constructor(props) {
        super(props)
        this.state = {
          hintLeft: '',
          hintRight: '',
          hint: '',
          secret: '',
          txInFlight: false
        }
      }

      componentWillReceiveProps (props) {
        if (this.state.coordinationGameStartHandler) {
          this.state.coordinationGameStartHandler.handle(
            props.transactions[this.state.coordinationGameStartTransactionId]
          )
            .onError((error) => {
              toastr.transactionError(error)
              this.setState({ coordinationGameStartHandler: null })
            })
            .onConfirmed(() => {
              this.setState({ coordinationGameStartHandler: null })
            })
            .onTxHash(() => {
              this.setState({ txInFlight: true })
              toastr.success('Application submitted successfully. It will take a few minutes to confirm on the Ethereum network.')
            })
        }
      }

      handleSubmit = (e) => {
        e.preventDefault()

        const { send, coordinationGameInstance } = this.props

        const random = new BN(Math.ceil(Math.random(1) * 1000000))

        const secretRandomHash = getWeb3().utils.sha3(
          ['bytes32', 'uint256'],
          [this.state.secret, random]
        ).toString('hex')
        const randomHash = getWeb3().utils.sha3(
          ['uint256'],
          [random]
        ).toString('hex')
        const hint = getWeb3().utils.toHex(this.state.hint)

        const coordinationGameStartTransactionId = send(
          coordinationGameInstance,
          'start',
          secretRandomHash,
          randomHash,
          hint
        )()

        this.setState({
          coordinationGameStartHandler: new TransactionStateHandler(),
          coordinationGameStartTransactionId
        })
      }

      handleSecretChange = (e) => {
        this.setState({
          secret: e.target.value
        })
      }

      handleHintChange = (e) => {
        let val = parseInt(e.target.value, 10) || 0

        if (val < 10000) {
          this.setState({
            [e.target.name]: val
          }, this.updateFinalHint)
        }
      }

      updateFinalHint = () => {
        this.setState({
          hint: this.state.hintLeft + this.state.hintRight
        })
      }

      render() {
        if (this.state.txInFlight) {
          return (
            <div className="hint-and-secret">
              <h3>
                Application submitted.
              </h3>
              Loading Spinner.
            </div>
          )
        }

        return (
          <form onSubmit={this.handleSubmit}>
            <div className="hint-and-secret">
              <h3>
                Provide a hint for the verifier:
              </h3>
              <input
                name="hintLeft"
                className="new-hint text-input"
                placeholder="345"
                onChange={this.handleHintChange}
                value={this.state.hintLeft}
              />
              <span className="text-operator">+</span>
              <br className="is-hidden-desktop" />
              <br className="is-hidden-desktop" />

              <input
                name="hintRight"
                className="new-hint text-input"
                placeholder="223"
                onChange={this.handleHintChange}
                value={this.state.hintRight}
              />
              <span className="text-operator">=</span>
              <br className="is-hidden-desktop" />
              <br className="is-hidden-desktop" />

              <input
                name="hint"
                className="hint text-input"
                placeholder=""
                value={this.state.hint}
                readOnly={true}
              />

              <br />
              <br />
              <br />
              {this.state.hintLeft !== '' && this.state.hintRight !== '' ?
                  (
                    <React.Fragment>
                      <h3>
                        Provide a secret:
                      </h3>
                      <div className="field">
                        <div className="control">
                          <input
                            className="new-secret text-input"
                            pattern="[0-9]*"
                            onChange={this.handleSecretChange}
                          />
                        </div>
                        <p className="help has-text-grey">
                          This could be {this.state.hint} (typical use case) or any other number up to 20000 (nefarious use case)
                        </p>
                      </div>
                    </React.Fragment>
                  )
                : null}

              {this.state.hintRight !== '' && this.state.hintLeft && this.state.secret !== '' ?
                  (
                    <React.Fragment>
                      <br />
                      <br />
                      <button type="submit" className="button is-light">Submit Hint &amp; Secret</button>
                    </React.Fragment>
                  )
                : null
              }

            </div>
          </form>
        )
      }
    }
  )
)
