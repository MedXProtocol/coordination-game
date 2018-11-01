import React, { Component } from 'react'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { VerifierApplicationsTable } from '~/components/Verify/VerifierApplicationsTable'

export const Verify = class _Verify extends Component {

  render() {
    return (
      <div>
        <ScrollToTop />
        <PageTitle title='verify' />

        <h1>
          Verify Applicants
        </h1>

        <div className="is-clearfix">
          <h6 className="is-size-6">
            Your Applications to Verify:
          </h6>
        </div>
        <VerifierApplicationsTable />
      </div>
    )
  }
}
