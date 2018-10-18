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

                <div className="hint-and-secret">
                  <br />
                  <br />
                  <input
                    className="new-hint text-input"
                    type="number"
                    min="1"
                    max="10000"
                    placeholder="345"
                    maxchars="5"
                    pattern="[0-9]*"
                  />
                  <span className="text-plus">+</span>
                  <input
                    className="new-hint text-input"
                    type="number"
                    min="1"
                    max="10000"
                    placeholder="223"
                    maxchars="5"
                    pattern="[0-9]*"
                  />

                  <br />
                  <br />
                  <input
                    className="new-secret text-input"
                    placeholder="What is the answer?"
                    type="number"
                    min="1"
                    max="10000"
                    placeholder="4500"
                    maxchars="5"
                    pattern="[0-9]*"
                  />
                </div>

                <div className="entries has-text-centered">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Application #</th>
                        <th>Hint</th>
                        <th>Secret</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="is-selected">
                        <th>1</th>
                        <th>200 + 200</th>
                        <th>400</th>
                      </tr>
                      <tr>
                        <th>1</th>
                        <th>300 + 2</th>
                        <th>5693</th>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>
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
