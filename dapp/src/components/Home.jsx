import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { ApplicationsTable } from '~/components/ApplicationsTable'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import * as routes from '~/../config/routes'

export const Home = class _Home extends Component {
  render() {
    return (
      <React.Fragment>
        <PageTitle title='home' />

        <ScrollToTop />

        <div className="tabs is-centered is-boxed is-fullwidth">
          <ul>
            <li className="is-active">
              <button>Your Current Applications</button>
            </li>
            <li>
              <button disabled={true}>Challenged Applications</button>
            </li>
            <li>
              <button disabled={true}>Accepted Applications</button>
            </li>
          </ul>
        </div>

        <ApplicationsTable topBorderless={true} />

        <br />
        <br />
        <hr />

        <div className="level--container">
          <nav className="level level--footer">
            <div className="level-item has-text-centered">
              <p className="title">
                <Link to={routes.APPLY} className="is-size-7">
                  Apply to be on the Registry
                </Link>
              </p>
            </div>

            <div className="level-item has-text-centered">
              <p className="title">
                <Link to={routes.STAKE} className="is-size-7">
                  Stake to become a Verifier
                </Link>
              </p>
            </div>
          </nav>
        </div>

      </React.Fragment>
    )
  }
}
