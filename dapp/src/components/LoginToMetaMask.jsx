import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Modal } from '~/components/Modal'
import metaMaskFoxAndWordmarkImg from '~/assets/img/metamask-fox-and-wordmark.svg'

function mapStateToProps(state, ownProps) {
  return {
    account: state.sagaGenesis.accounts[0]
  }
}

export const LoginToMetaMask = connect(mapStateToProps)(class _LoginToMetaMask extends Component {

  constructor(props) {
    super(props)

    this.state = {
      modalState: false
    }
  }

  toggleModal = () => {
    // this.setState((prev, props) => {
    //   return { modalState: !prev.modalState }
    // })
  }

  componentDidMount() {
    this.determineModalState(this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.determineModalState(nextProps)
  }

  determineModalState(nextProps) {
    let newModalState = true
    if (!this.props.account && nextProps && nextProps.account) {
      newModalState = false
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
          <img
            width='120'
            src={metaMaskFoxAndWordmarkImg} alt="MetaMask logo"
          />
          <br />
          <br />
          <h3 className="is-size-3">
            We see you're using MetaMask, nice!
          </h3>

          <h5 className="is-size-5">
            To continue click the fox in the top-right corner to log in to your MetaMask account.
          </h5>
        </div>
      </Modal>
    )
  }
})
