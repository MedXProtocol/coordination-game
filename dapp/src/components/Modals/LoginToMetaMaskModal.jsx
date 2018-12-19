import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import { connect } from 'react-redux'
import { Modal } from '~/components/Modals/Modal'
import MetaMaskFoxAndWordmarkImg from '~/assets/img/metamask-fox-and-wordmark.svg'
import { defined } from '~/utils/defined'

const ACTIVATE_DURATION = 2000

function mapStateToProps(state, ownProps) {
  return {
    address: state.sagaGenesis.accounts[0]
  }
}

export const LoginToMetaMaskModal =
  connect(mapStateToProps)(
    ReactTimeout(
      class _LoginToMetaMaskModal extends Component {

      constructor(props) {
        super(props)

        this.state = {
          enoughTimePassed: false,
          modalState: false,
          error: '',
          isUnlocked: undefined,
          isEnabled: undefined,
          isApproved: undefined
        }
      }

      componentDidMount() {
        this.props.setTimeout(
          () => {
            this.interval = this.props.setInterval(this.checkEthereum, 1000)

            this.setState({
              enoughTimePassed: true
            }, this.determineModalState)
          },
          ACTIVATE_DURATION
        )
      }

      componentWillReceiveProps(nextProps) {
        this.determineModalState(nextProps)
      }

      componentWillUnmount() {
        this.clearInterval()
      }

      determineModalState(nextProps) {
        let newModalState = false
        let props = nextProps ? nextProps : this.props

        if (this.state.enoughTimePassed && !!window.web3 && !defined(props.address)) {
          newModalState = true
        }

        this.setState({
          modalState: newModalState
        }, () => {
          if (!this.state.modalState) {
            this.clearInterval()
          }
        })
      }

      clearInterval = () => {
        this.props.clearInterval(this.interval)
      }

      enableEthereum = async (e) => {
        e.preventDefault()

        this.setState({ error: '' })

        if (window.ethereum) {
          try {
            await window.ethereum.enable()
          } catch (error) {
            if (error !== 'User rejected provider access') {
              console.error(error)
            }

            this.setState({ error: error })
          }
        }
      }

      checkEthereum = async () => {
        if (window.ethereum) {
          let isUnlocked,
            isEnabled,
            isApproved

          if (window.ethereum._metamask) {
            isUnlocked = await window.ethereum._metamask.isUnlocked()
            isEnabled  = await window.ethereum._metamask.isEnabled()
            isApproved = await window.ethereum._metamask.isApproved()
          }

          // hack due to a MetaMask bug that shows up when you Quit Chrome and re-open Chrome
          // right back to the tab using MetaMask
          if ((isUnlocked && isApproved) && !defined(this.props.address)) {
            window.location.reload(true)
          }

          this.setState({
            isUnlocked,
            isEnabled,
            isApproved
          })
        }
      }

      toggleModal = () => {

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

              {this.state.isUnlocked && !this.state.isApproved
                ? (
                  <div className="text-center">
                    <br />
                    <button className="button is-light is-primary is-outlined" onClick={this.enableEthereum}>
                      Authorize The Token Registry DApp
                    </button>
                    <br />
                    <br />

                    {this.state.error ?
                      (
                        <p>
                          Please authorize read-only access to your MetaMask accounts use The Token Registry.
                          <br />
                          <span className="has-text-grey-lighter">You will still need to manually sign transactions yourself.</span>
                          {/*There was an error: {this.state.error}*/}
                        </p>

                      ) : null
                    }
                  </div>
                ) : null
              }

              {!this.state.isUnlocked
                ? (
                  <h6 className="is-size-6">
                    To continue click the fox in the top-right corner to log in to your MetaMask account.
                  </h6>
                )
                : null
              }
            </div>
          </Modal>
        )
      }
    }
  )
)
