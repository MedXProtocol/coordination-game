import React, { Component } from 'react'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'

export const FAQ = class _FAQ extends Component {
  render() {
    return (
      <div className='column is-8-widescreen is-offset-2-widescreen'>
        <PageTitle title='faq' />
        <ScrollToTop />

        <h2 className="is-size-2">
          Frequently Asked Questions
        </h2>

        <br />

        <h6 className="is-size-6">
          What is this?
        </h6>

        <p>
          This is a game for incentivizing objective TCRs using a work contract.
        </p>

        <h6 className="is-size-6 faq-h6">
          What is a work contract?
        </h6>
        <p>
          A work contract is a mechanism that determines who is able to participate as a “Worker” in a cryptoeconomic system. To become an eligible Worker, a user must stake tokens. When a new Job is available, a Worker is selected to complete it.
        </p>
      </div>
    )
  }
}
