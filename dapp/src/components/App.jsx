import React, { Component } from 'react'
import { hot } from 'react-hot-loader'
import { Header } from './Header'

const App = class extends Component {
  render() {
    return (
      <section className='section'>
        <div className='container'>
          <div className='columns'>
            <div className='column is-one-half-desktop'>
              <Header />

              <div className="entries">
                <input className="new-hint" placeholder="What's the hint?" value="" />
                <br />
                <br />
                <input className="new-secret" placeholder="What is the answer?" value="" />

                <ul>
                  <li>

                  </li>
                </ul>
              </div>

              <footer>
                <p>
                  What is this?
                </p>
              </footer>
            </div>
          </div>
        </div>
      </section>
    )
  }
}

export const AppContainer = hot(module)(App)
