import React, { Component } from 'react'
import { hot } from 'react-hot-loader'
import { Header } from './Header'

const App = class extends Component {

  constructor(props) {
    super(props)
    this.state = {
      hintLeft: '',
      hintRight: '',
      hint: '',
      secret: ''
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
                  {this.state.hint !== '' ?
                      (
                        <React.Fragment>
                          <h3>
                            Provide a secret to submit with the hint.
                          </h3>
                          <div className="field">
                            <div className="control">
                              <input
                                className="new-secret text-input"
                                pattern="[0-9]*"
                                onChange={this.handleSecretChange}
                              />
                            </div>
                            <p className="help is-dark">
                              This could be {this.state.hint} (typical use case) or any other number up to 20000 (nefarious use case)
                            </p>
                          </div>
                        </React.Fragment>
                      )
                    : null}
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
                      <tr>
                        <th>1</th>
                        <th>200 + 200</th>
                        <th>400</th>
                        <th>Verified</th>
                      </tr>
                      <tr>
                        <th>2</th>
                        <th>300 + 2</th>
                        <th>5693</th>
                        <th>Rejected</th>
                      </tr>
                      <tr>
                        <th>3</th>
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
            <p className="has-text-grey">
              Explain the Coordination Game, demo, what a Trustless Incentivized List is and link to a blog post with more info.
            </p>
          </footer>
        </section>
      </React.Fragment>
    )
  }
}

export const AppContainer = hot(module)(App)
