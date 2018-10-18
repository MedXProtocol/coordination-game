import React, { Component } from 'react'
import { hot } from 'react-hot-loader'
import { Header } from './Header'

const App = class extends Component {
  render() {
    return (
      <React.Fragment>
        <section className='section'>
          <div className='container'>
            <div className='columns'>
              <div className='column is-one-half-desktop'>
                <Header />

                <div className="entries">
                <br />
                <br />
                  <input className="new-hint" placeholder="What's the hint?" />
                  <br />
                  <br />
                  <input className="new-secret" placeholder="What is the answer?" />

                  <ul>
                    <li>

                    </li>
                  </ul>
                </div>

              </div>
            </div>
          </div>

          <br />
          <br />
          <br />
          <br />
          <br />

          <footer className="has-text-centered">
            <h3>
              What is this?
            </h3>
            <p>
              (Trustless Incentivized List)
            </p>
          </footer>
        </section>
      </React.Fragment>
    )
  }
}

export const AppContainer = hot(module)(App)
