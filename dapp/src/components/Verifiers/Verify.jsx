import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { VerifierApplicationsTable } from '~/components/Verifiers/VerifierApplicationsTable'
import { VerifyApplication } from '~/components/Verifiers/VerifyApplication'
import { ApplicationsList } from '~/components/Verifiers/ApplicationsList'

function mapStateToProps(state) {
  const applicationId = get(state, 'verifier.applicationId')

  return {
    applicationId
  }
}

export const Verify = connect(mapStateToProps)(
  class _Verify extends Component {

    render() {
      let verifyApplication,
        verifyApplicationsTable

      if (this.props.applicationId) {
        verifyApplication = <VerifyApplication applicationId={this.props.applicationId} />
      } else {
        verifyApplicationsTable = <VerifierApplicationsTable />
      }

      return (
        <div>
          <ScrollToTop />
          <PageTitle title='verify' />

          <h1 className="is-size-1">
            Applicants
          </h1>

          {verifyApplicationsTable}
          {verifyApplication}

          <br />
          <br />
          <br />

          <div className="is-clearfix">
            <h6 className="is-size-6">
              All Applications
            </h6>
          </div>

          <ApplicationsList />
        </div>
      )
    }
  }
)
