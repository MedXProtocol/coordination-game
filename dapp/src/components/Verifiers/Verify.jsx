import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import queryString from 'query-string'
import { AnimatedWrapper } from "~/components/Layout/AnimatedWrapper"
import { Footer } from '~/components/Layout/Footer'
import { PageTitle } from '~/components/Helpers/PageTitle'
import { ScrollToTop } from '~/components/Helpers/ScrollToTop'
import { VerifierApplicationsTable } from '~/components/Verifiers/VerifierApplicationsTable'
import { VerifiersTable } from '~/components/Verifiers/VerifiersTable'
import { VerifierStake } from '~/components/Verifiers/VerifierStake'

function mapStateToProps(state, { location }) {
  const applicationId = get(state, 'verifier.applicationId')
  const verifierApplicationsTableCurrentPage = queryString.parse(location.search).verifierApplicationsTableCurrentPage

  return {
    applicationId,
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
              disabled={this.props.verifierApplicationsTableCurrentPage}
            />
            <PageTitle title='verify' />

            <h1 className="is-size-1">
              Verify Token Submissions
            </h1>

            <VerifierStake />

            <br />
            <hr />
            <br />

            <VerifierApplicationsTable
              currentPage={this.props.verifierApplicationsTableCurrentPage}
              currentPageParamName='verifierApplicationsTableCurrentPage'
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
