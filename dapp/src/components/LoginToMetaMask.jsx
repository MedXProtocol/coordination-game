import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import { connect } from 'react-redux'
import { Modal } from '~/components/Modal'
import MetaMaskFoxAndWordmarkImg from '~/assets/img/metamask-fox-and-wordmark.svg'
import { defined } from '~/utils/defined'

const ACTIVATE_DURATION = 2000

function mapStateToProps(state, ownProps) {
  return {
    address: state.sagaGenesis.accounts[0]
  }
}

export const LoginToMetaMask =
  connect(mapStateToProps)(
    ReactTimeout(
      class _LoginToMetaMask extends Component {

      constructor(props) {
        super(props)

        this.state = {
          enoughTimePassed: false,
          modalState: false
        }
      }

      toggleModal = () => {
        // this.setState((prev, props) => {
        //   return { modalState: !prev.modalState }
        // })
      }

      componentWillReceiveProps(nextProps) {
        this.determineModalState(nextProps)
      }

      componentDidMount() {
        this.props.setTimeout(
          () => {
            this.setState({
              enoughTimePassed: true
            }, this.determineModalState)
          },
          ACTIVATE_DURATION
        )
      }

      determineModalState(nextProps) {
        let newModalState = false
        let props = nextProps ? nextProps : this.props

        if (this.state.enoughTimePassed && window.web3 && !defined(props.address)) {
          newModalState = true
        }

        this.setState({
          modalState: newModalState
        })
      }

      render () {
        return (
          <Modal
            closeModal={this.toggleModal}
            modalState={this.state.modalState}
            title="Example modal title"
          >
            <div className='has-text-centered'>
              <MetaMaskFoxAndWordmarkImg width="150" />
              <br />
              <h4 className="is-size-4">
                We see you're using MetaMask, nice!
              </h4>

              <h6 className="is-size-6">
                To continue click the fox in the top-right corner to log in to your MetaMask account.
              </h6>
            </div>
          </Modal>
        )
      }
    }
  )
)
