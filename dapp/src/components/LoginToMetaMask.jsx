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
            console.log('here')
            console.log(this.interval)


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

      componentWillUmount () {
        this.props.clearInterval(this.interval)
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
        console.log('checking')
        if (window.ethereum) {
          let isUnlocked,
            isEnabled,
            isApproved

          if (window.ethereum._metamask) {
            isUnlocked = await window.ethereum._metamask.isUnlocked()
            isEnabled  = await window.ethereum._metamask.isEnabled()
            isApproved = await window.ethereum._metamask.isApproved()
          }

          this.setState({
            isUnlocked,
            isEnabled,
            isApproved
          })
        }
      }

      toggleModal = () => {
        // this.setState((prev, props) => {
        //   return { modalState: !prev.modalState }
        // })
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
                    <a className="button is-light is-primary " onClick={this.enableEthereum}>
                      Authorize The Coordination Game
                    </a>
                    <br />
                    <br />

                    {this.state.error ?
                      (
                        <p>
                          There was an error: {this.state.error}
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
