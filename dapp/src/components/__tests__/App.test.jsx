import React from 'react'
import { App } from '~/components/App'
import { store } from '~/store'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

function buildProps({ pathname, address, account, signedIn, web3Failed } = { web3Failed: false }) {
  return {
    location: {
      pathname
    },
    address,
    web3Failed
  }
}

function setup(props) {
  return shallow(
    <Provider store={store}>
      <BrowserRouter>
        <App {...props} />
      </BrowserRouter>
    </Provider>
  )
}

// Smokescreen integration test, captures the state of the entire App component
// tree and stores it to compare for next test run
//
// This test will fail if you've made changes to the App component and it's
// children's structure. Use jest's 'u' cmd to update the failing test snapshot

describe('App component', () => {
  it('render', () => {
    const props = buildProps({
      address: '0x09',
      pathname: '/foo'
    })

    const component = setup(props)

    expect(component).toMatchSnapshot()
  })
})
