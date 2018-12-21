import React, { Component } from 'react'
import { Modal } from '~/components/Modals/Modal'
import DownloadMetamaskButtonImg from '~/assets/img/button--download-metamask.png'
import GetCoinbaseWalletImg from '~/assets/img/getCoinbaseWallet.svg'
import GetOperaImg from '~/assets/img/getOpera.svg'
import { getMobileOperatingSystem } from '~/utils/getMobileOperatingSystem'

export const GetWallet = class _GetWallet extends Component {

  constructor(props) {
    super(props)

    this.state = {
      modalState: false
    }
  }

  componentDidMount() {
    this.determineModalState(this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.determineModalState(nextProps)
  }

  determineModalState(nextProps) {
    let newModalState = true
    if (window.web3) {
      newModalState = false
    }

    this.setState({
      modalState: newModalState
    })
  }

  noop = () => {}

  render () {
    let mobileBrowser

    if (getMobileOperatingSystem() === 'iOS') {
      mobileBrowser = {
        img: <GetCoinbaseWalletImg />,
        name: 'Coinbase Wallet',
        link: 'https://itunes.apple.com/us/app/coinbase-wallet/id1278383455?mt=8'
      }
    } else {
      mobileBrowser = {
        img: <GetOperaImg />,
        name: 'Opera',
        link: 'https://play.google.com/store/apps/details?id=com.opera.browser'
      }
    }

    return (
      <Modal
        closeModal={this.noop}
        modalState={this.state.modalState}
        title="Example modal title"
      >
        <div className='has-text-centered'>
          <h5 className="is-size-5">
            To use this demo you will need to use an Ethereum wallet
          </h5>

          <p>
            Mobile DApp browsers such as {mobileBrowser.name} are supported.
            If you're new to cryptocurrency we recommend {mobileBrowser.name} so
            you can easily purchase Ether:
          </p>
          <br />
          <a
            href={mobileBrowser.link}
            target="_blank"
            rel="noopener noreferrer"
            title={`Get ${mobileBrowser.name}`}
          >
            {mobileBrowser.img}
          </a>

          <br />
          <br />

          <p>
            On desktop, we recommend <a href='https://metamask.io/' title='MetaMask' target="_blank" rel="noopener noreferrer">MetaMask</a> &mdash; a wallet extension for Chrome, Firefox and Brave browsers:
          </p>
          <br />
          <a href="https://metamask.io" title="Download Metamask" target="_blank" rel="noopener noreferrer"><img src={DownloadMetamaskButtonImg} alt="Metamask Download Button" width="200" /></a>
        </div>
      </Modal>
    )
  }
}
