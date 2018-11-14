import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { Listings } from '~/components/registry/Listings'
import * as routes from '~/../config/routes'

export const Home = class _Home extends Component {
  render() {
    return (
      <React.Fragment>
        <PageTitle title='home' />
        <ScrollToTop />

          <Link to={routes.REGISTER_TOKEN} className="button is-outlined is-primary is-pulled-right is-small">
            Register a Token
          </Link>
        <Listings currentPage={this.props.match.params.currentPage} />
      </React.Fragment>
    )
  }
}
