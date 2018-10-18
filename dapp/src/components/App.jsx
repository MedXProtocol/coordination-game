import React, { Component } from 'react'
import { hot } from 'react-hot-loader'
import { Header } from './Header'

const App = class extends Component {

  constructor(props) {
    super(props)
    this.state = {
      hintLeft: '',
      hintRight: '',
      hint: ''
    }
  }

  handleSecretChange = (e) => {
    this.setState({
      secret: e.target.value
    })
  }

  handleHintChange = (e) => {
    let val = parseInt(e.target.value, 10) || 0

    if (val < 10000) {
      this.setState({
        [e.target.name]: val
      }, this.updateFinalHint)
    }
  }

  updateFinalHint = () => {
    this.setState({
      hint: this.state.hintLeft + this.state.hintRight
    })
  }

  render() {
    return (
      <React.Fragment>
        <section className='section'>
          <div className='container is-fluid'>
            <div className='columns'>
              <div className='column is-one-half-desktop'>
                <Header />

                <div className="hint-and-secret">
                  <h3>
                    Provide a hint for the verifier:
                  </h3>
                  <input
                    name="hintLeft"
                    className="new-hint text-input"
                    placeholder="345"
                    onChange={this.handleHintChange}
                    value={this.state.hintLeft}
                  />
                  <span className="text-operator">+</span>
                  <input
                    name="hintRight"
                    className="new-hint text-input"
                    placeholder="223"
                    onChange={this.handleHintChange}
                    value={this.state.hintRight}
                  />
                  <span className="text-operator">=</span>
                  <input
                    name="hint"
                    className="hint text-input"
                    placeholder=""
                    value={this.state.hint}
                    readOnly={true}
                  />

                  <br />
                  <br />
                  <br />
                  <br />
                  <h3>
                    What is the secret (answer) you would like to submit?
                  </h3>
                  <input
                    className="new-secret text-input"
                    pattern="[0-9]*"
                    onChange={this.handleSecretChange}
                  />
                </div>

                <div className="entries has-text-centered">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Application #</th>
                        <th>Hint</th>
                        <th>Secret</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="is-selected">
                        <th>1</th>
                        <th>200 + 200</th>
                        <th>400</th>
                        <th>Verified</th>
                      </tr>
                      <tr>
                        <th>1</th>
                        <th>300 + 2</th>
                        <th>5693</th>
                        <th>Rejected</th>
                      </tr>
                      <tr>
                        <th>1</th>
                        <th>342 + 182</th>
                        <th>3</th>
                        <th>Challenged</th>
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
