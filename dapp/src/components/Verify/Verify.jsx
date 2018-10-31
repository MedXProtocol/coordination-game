import React, { Component } from 'react'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'

export const Verify = class _Verify extends Component {

  render() {
    return (
      <div>
        <ScrollToTop />
        <PageTitle title='verify' />

        <h1>
          Verify Applicants
        </h1>

        <p>
          This is not yet ready. Come back soon!
        </p>
      </div>
    )
  }
}
