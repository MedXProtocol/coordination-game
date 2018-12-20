import React, { Component } from 'react'
import queryString from 'query-string'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { AnimatedWrapper } from "~/components/Layout/AnimatedWrapper"
import { PageTitle } from '~/components/Helpers/PageTitle'
import { Footer } from '~/components/Layout/Footer'
import { ScrollToTop } from '~/components/Helpers/ScrollToTop'
import { Listings } from '~/components/Registry/Listings'
import { OwnerListings } from '~/components/Registry/OwnerListings'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { location }) {
  const listingsCurrentPage = queryString.parse(location.search).listingsCurrentPage
  const ownerListingsCurrentPage = queryString.parse(location.search).ownerListingsCurrentPage

  return {
    listingsCurrentPage,
    ownerListingsCurrentPage
  }
}

export const Home = connect(mapStateToProps)(
  AnimatedWrapper(
    class _Home extends Component {
      render() {
        return (
          <React.Fragment>
            <PageTitle title='home' />

            <ScrollToTop disabled={this.props.ownerListingsCurrentPage} />

            <div className="is-clearfix">
              <div className="columns">
                <div className="column is-6">
                  <h6 className="list--title">
                    Active Listings
                  </h6>
                </div>

                <div className="column is-6 list--action-container">
                  <Link to={routes.REGISTER_TOKEN} className="button is-outlined is-primary is-small list--action">
                    Register a Token
                  </Link>
                </div>
              </div>
            </div>
            <Listings
              currentPage={this.props.listingsCurrentPage}
            />

            <br />
            <br />
            <br />

            <div className="is-clearfix">
              <div className="columns">
                <div className="column is-12">
                  <h6 className="list--title">
                    Your Listings
                  </h6>
                </div>
              </div>
            </div>
            <OwnerListings
              currentPage={this.props.ownerListingsCurrentPage}
            />

            <Footer />
          </React.Fragment>
        )
      }
    }
  )
)
