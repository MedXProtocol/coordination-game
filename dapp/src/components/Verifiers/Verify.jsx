import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { VerifierApplicationsTable } from '~/components/Verifiers/VerifierApplicationsTable'
import { VerifyApplication } from '~/components/Verifiers/VerifyApplication'

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

          <h1>
            Verify Applicants
          </h1>

          {verifyApplicationsTable}
          {verifyApplication}
        </div>
      )
    }
  }
)
