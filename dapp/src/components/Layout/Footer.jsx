import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { DebugLog } from '~/components/Layout/DebugLog'
import * as routes from '~/../config/routes'

export const Footer = class _Footer extends Component {
  constructor(props) {
    super(props)

    this.state = {
    }
  }

  render() {
    if (process.env.REACT_APP_ENABLE_DEBUGGER) {
      if (this.state.debugging) {
        var debugLog =
          <div>
            <hr />
            <DebugLog />
          </div>
      }

      var debugLink =
        <div>
          {/*<a onClick={this.handleBugsnagTrigger} className='btn btn-danger'>Trigger Bugsnag Notification</a>*/}
          <button
            onClick={() => this.setState({ debugging: !this.state.debugging })}
            className='button button-primary'
          >
            Toggle Log
          </button>
          {debugLog}
        </div>
    }

    return (
      <React.Fragment>
        <br />
        <br />
        <br />

        <div className="level--container">
          <nav className="level level--body">
            <div className="level-item has-text-centered">
              <div>
                <p className="heading is-size-5 has-text-grey-lighter">
                  What is The Token Registry?
                </p>
                <p className="title">
                  <Link to={routes.FAQ} className="is-size-7">
                    Read the FAQ
                  </Link>
                </p>
              </div>
            </div>
          </nav>

          <nav className="level level--footer">
            <div className="level-item has-text-centered">
              <div>
                <p className="title">
                  <Link to={routes.REGISTER_TOKEN} className="is-size-7">
                    Apply to be on the Registry
                  </Link>
                </p>
              </div>
            </div>

            <div className="level-item has-text-centered">
              <div>
                <p className="title">
                  <Link to={routes.VERIFY} className="is-size-7">
                    Stake to become a Verifier
                  </Link>
                </p>
              </div>
            </div>
          </nav>
        </div>


        <section className='section section--footer'>
          <footer className="footer has-text-centered">
            <div className='columns'>
              <div className='column is-half-tablet is-offset-one-quarter'>
                <p className="text-footer">
                  &copy; Copyright 2018 Medical Exchange Protocols. All Rights Reserved.
                </p>
                <br />
                <br />
                {debugLink}
              </div>
            </div>
          </footer>
        </section>
      </React.Fragment>
    )
  }
}
