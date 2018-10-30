import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { ApplicationsTable } from '~/components/ApplicationsTable'
import { ApplicantsTable } from '~/components/ApplicantsTable'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { TILTable } from '~/components/TILTable'
import * as routes from '~/../config/routes'

export const Home = class _Home extends Component {
  render() {
    return (
      <React.Fragment>
        <PageTitle title='home' />

        <ScrollToTop />

        {/*}<div class="tabs is-toggle is-fullwidth">*/}
        <div class="tabs is-centered is-boxed">
          <ul>
            <li class="is-active">
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

        <ApplicationsTable />
        {/*

        <hr />

        <div className="is-clearfix">
          <h6 className="is-size-6 is-pulled-left">
            Current Applicants:
          </h6>
          <ApplicantsTable />
          <Link to={routes.APPLY} className="is-pulled-right is-size-7">
            Apply to the Registry
          </Link>
        </div>

        <hr />

        <h6 className="is-size-6 is-pulled-left">
          Registry:
        </h6>
        <TILTable />*/}
      </React.Fragment>
    )
  }
}
