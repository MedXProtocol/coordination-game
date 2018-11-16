import React, { Component } from 'react'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { Listings } from '~/components/registry/Listings'

export const Home = class _Home extends Component {
  render() {
    return (
      <React.Fragment>
        <PageTitle title='home' />
        <ScrollToTop />

        <Listings currentPage={this.props.match.params.currentPage} />
      </React.Fragment>
    )
  }
}
