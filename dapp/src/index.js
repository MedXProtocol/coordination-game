import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from '~/components/Layout/ErrorBoundary'
import { Provider } from 'react-redux'
import { AppContainer } from '~/components/App'
import { store } from '~/store'
import * as serviceWorker from './serviceWorker'

import 'odometer/themes/odometer-theme-minimal.css'
import './index.scss'

window.addEventListener('load', () => {
  let coreApp =
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <AppContainer />
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>

  ReactDOM.render(coreApp, document.getElementById('root'))
})

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister()
