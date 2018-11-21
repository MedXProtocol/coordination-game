import React, { Component } from 'react'
import { connect } from 'react-redux'
import queryString from 'query-string'
import { AnimatedWrapper } from "~/components/AnimatedWrapper"
import { PageTitle } from '~/components/PageTitle'
import { Footer } from '~/components/Footer'
import { ScrollToTop } from '~/components/ScrollToTop'
import { Listings } from '~/components/registry/Listings'

function mapStateToProps(state, { location }) {
  const listingsCurrentPage = queryString.parse(location.search).listingsCurrentPage

  return {
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

            <ScrollToTop disabled={this.props.listingsCurrentPage} />
            
            <Listings currentPage={this.props.listingsCurrentPage} />

            <Footer />
          </React.Fragment>
        )
      }
    }
  )
)
