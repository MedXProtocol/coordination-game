import React, { Component } from 'react'
import { connect } from 'react-redux'
import { AnimatedWrapper } from "~/components/AnimatedWrapper"
import { Footer } from '~/components/Footer'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { storeKeyValInLocalStorage } from '~/services/storeKeyValInLocalStorage'

function mapDispatchToProps(dispatch) {
  return {
    dispatchShowIntroModal: () => {
      dispatch({ type: 'SHOW_INTRO_MODAL' })
    }
  }
}

export const FAQ = connect(null, mapDispatchToProps)(
  AnimatedWrapper(
    class _FAQ extends Component {

      handleShowIntro = (e) => {
        e.preventDefault()

        storeKeyValInLocalStorage('dontShowIntroModal', null)

        this.props.dispatchShowIntroModal()
      }

      render() {
        return (
          <div className='column is-8-widescreen is-offset-2-widescreen'>
            <PageTitle title='faq' />
            <ScrollToTop />

            <h2 className="is-size-2">
              Frequently Asked Questions
            </h2>


            <button onClick={this.handleShowIntro} className="button is-small is-outlined is-primary">
              See Illustrated Demo
            </button>

            <br />
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

            <Footer />
          </div>
        )
      }
    }
  )
)
