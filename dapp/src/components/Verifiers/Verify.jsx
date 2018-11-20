import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { AnimatedWrapper } from "~/components/AnimatedWrapper"
import { get } from 'lodash'
import { Footer } from '~/components/Footer'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { ApplicationsList } from '~/components/Verifiers/ApplicationsList'
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
  AnimatedWrapper(
    class _Verify extends PureComponent {

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
                {/* This should possibly be it's own route, and should be something like /applications/:pageNumber */}
              </h6>
            </div>

            {/* This should possibly be it's own route, and should be something like /applications/:pageNumber */}
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

            <Footer />
          </div>
        )
      }
    }
  )
)
