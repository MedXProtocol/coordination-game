import React, { Component } from 'react'
import { hot } from 'react-hot-loader'
import ReduxToastr from 'react-redux-toastr'
import { Header } from './Header'
import { StartGameFormContainer } from './StartGameForm'

const App = class extends Component {

  render() {
    return (
      <React.Fragment>
        <ReduxToastr
          timeOut={7000}
          newestOnTop={true}
          tapToDismiss={false}
          position="bottom-left"
          transitionIn="bounceIn"
          transitionOut="bounceOut"
        />
        <section className='section'>
          <div className='container is-fluid'>
            <div className='columns'>
              <div className='column is-one-half-desktop'>
                <Header />

                <StartGameFormContainer />
                <hr />

              </div>
            </div>

            <div className='columns'>
              <div className='column is-half-desktop is-offset-one-quarter'>

              <div className="entries has-text-centered">
                <table className="table is-fullwidth">
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

          <div className='columns'>
            <div className='column is-half-desktop is-offset-one-quarter'>
              <footer className="has-text-centered">
                <h3>
                  What is this?
                </h3>
                <p className="has-text-grey-light">
                  Explain the Coordination Game, demo, what a Trustless Incentivized List is and link to a blog post with more info.
                </p>
              </footer>
            </div>
          </div>

          </div>
          <br />

        </section>
      </React.Fragment>
    )
  }
}

export const AppContainer = hot(module)(App)
