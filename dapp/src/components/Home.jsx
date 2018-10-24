import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { PageTitle } from '~/components/PageTitle'
import { ApplicantsTable } from '~/components/ApplicantsTable'
import { TILTable } from '~/components/TILTable'
import * as routes from '~/../config/routes'

export const Home = class _Home extends Component {
  render() {
    return (
      <React.Fragment>
        <PageTitle title='home' />

        <div className="is-clearfix">
          <h6 className="is-size-6 is-pulled-left">
            Current Applicants:
          </h6>
          {/*}<Link to={routes.APPLY} className="is-pulled-right is-size-7">
            Apply to the Registry
          </Link>*/}
          <ApplicantsTable />
          <Link to={routes.APPLY} className="is-pulled-right is-size-7">
            Apply to the Registry
          </Link>
        </div>

        <hr />

        <h6 className="is-size-6 is-pulled-left">
          Registry:
        </h6>
        <TILTable />
      </React.Fragment>
    )
  }
}
