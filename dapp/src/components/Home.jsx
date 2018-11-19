import React, { Component } from 'react'
import { AnimatedWrapper } from "~/components/AnimatedWrapper"
import { PageTitle } from '~/components/PageTitle'
import { Footer } from '~/components/Footer'
import { ScrollToTop } from '~/components/ScrollToTop'
import { Listings } from '~/components/registry/Listings'

export const Home = AnimatedWrapper(
  class _Home extends Component {
    render() {
      return (
        <React.Fragment>
          <PageTitle title='home' />
          <ScrollToTop />

          <Listings currentPage={this.props.match.params.currentPage} />

          <Footer />
        </React.Fragment>
      )
    }
  }
)
