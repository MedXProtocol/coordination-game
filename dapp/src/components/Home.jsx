import React, { Component } from 'react'
import { connect } from 'react-redux'
import queryString from 'query-string'
import { AnimatedWrapper } from "~/components/AnimatedWrapper"
import { ApplicationsList } from '~/components/Applications/ApplicationsList'
import { PageTitle } from '~/components/PageTitle'
import { Footer } from '~/components/Footer'
import { ScrollToTop } from '~/components/ScrollToTop'
import { Listings } from '~/components/registry/Listings'

function mapStateToProps(state, { location }) {
  const applicationsListCurrentPage = queryString.parse(location.search).applicationsListCurrentPage
  const listingsCurrentPage = queryString.parse(location.search).listingsCurrentPage

  return {
    applicationsListCurrentPage,
    listingsCurrentPage
  }
}

export const Home = connect(mapStateToProps)(
  AnimatedWrapper(
    class _Home extends Component {
      render() {
        return (
          <React.Fragment>
            <PageTitle title='home' />

            <ScrollToTop disabled={this.props.listingsCurrentPage || this.props.applicationsListCurrentPage} />

            <Listings currentPage={this.props.listingsCurrentPage} />

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

            <Footer />
          </React.Fragment>
        )
      }
    }
  )
)
