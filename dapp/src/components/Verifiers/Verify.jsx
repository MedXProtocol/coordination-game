import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { ApplicationsList } from '~/components/Verifiers/ApplicationsList'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { VerifierApplicationsTable } from '~/components/Verifiers/VerifierApplicationsTable'
import { VerifiersTable } from '~/components/Verifiers/VerifiersTable'
import { VerifyApplication } from '~/components/Verifiers/VerifyApplication'
import { VerifierStake } from '~/components/Verifiers/VerifierStake'

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
            Verify Token Submissions
          </h1>

          <VerifierStake />

          <br />
          <br />

          {verifyApplicationsTable}
          {verifyApplication}

          <br />
          <br />
          <br />

          <div className="is-clearfix">
            <h6 className="is-size-6">
              All Token Submissions
            </h6>
          </div>

          <ApplicationsList />

          <br />
          <br />
          <br />

          <div className="is-clearfix">
            <h6 className="is-size-6">
              Active Verifiers:
            </h6>
          </div>
          <VerifiersTable />
        </div>
      )
    }
  }
)
