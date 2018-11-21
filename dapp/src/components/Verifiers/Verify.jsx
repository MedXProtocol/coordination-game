import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import queryString from 'query-string'
import { AnimatedWrapper } from "~/components/AnimatedWrapper"
import { Footer } from '~/components/Footer'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { ApplicationsList } from '~/components/Verifiers/ApplicationsList'
import { VerifierApplicationsTable } from '~/components/Verifiers/VerifierApplicationsTable'
import { VerifiersTable } from '~/components/Verifiers/VerifiersTable'
import { VerifierStake } from '~/components/Verifiers/VerifierStake'

function mapStateToProps(state, { location }) {
  const applicationId = get(state, 'verifier.applicationId')
  const applicationsListCurrentPage = queryString.parse(location.search).applicationsListCurrentPage
  const verifierApplicationsTableCurrentPage = queryString.parse(location.search).verifierApplicationsTableCurrentPage

  return {
    applicationId,
    applicationsListCurrentPage,
    verifierApplicationsTableCurrentPage
  }
}

export const Verify = connect(mapStateToProps)(
  AnimatedWrapper(
    class _Verify extends PureComponent {

      render() {
        return (
          <div>
            <ScrollToTop
              disabled={this.props.applicationsListCurrentPage || this.props.verifierApplicationsTableCurrentPage}
            />
            <PageTitle title='verify' />

            <h1 className="is-size-1">
              Verify Token Submissions
            </h1>

            <VerifierStake />

            <br />
            <br />

            <VerifierApplicationsTable
              currentPage={this.props.verifierApplicationsTableCurrentPage}
            />

            <br />
            <br />
            <br />

            <div className="is-clearfix">
              <h6 className="is-size-6">
                All Token Submissions
              </h6>
            </div>

            <ApplicationsList
              currentPage={this.props.applicationsListCurrentPage}
            />

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
