import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { ApplicantApplicationsTable } from '~/components/ApplicantApplicationsTable'
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

        <Listings currentPage={this.props.match.params.page} />
      </React.Fragment>
    )
  }
}
