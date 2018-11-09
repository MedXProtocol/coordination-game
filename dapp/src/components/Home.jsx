import React, { Component } from 'react'
import { ApplicantApplicationsTable } from '~/components/ApplicantApplicationsTable'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'

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

        <ApplicantApplicationsTable topBorderless={true} />
      </React.Fragment>
    )
  }
}
