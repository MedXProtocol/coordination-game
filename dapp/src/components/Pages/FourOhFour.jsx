import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { PageTitle } from '~/components/Helpers/PageTitle'
import { AnimatedWrapper } from "~/components/Layout/AnimatedWrapper"
import * as routes from '~/../config/routes'

export const FourOhFour = AnimatedWrapper(
  class _FourOhFour extends Component {
    render() {
      let path = routes.HOME

      return (
        <div>
          <PageTitle title='fourOhFour' />

          <h5 className="is-size-5">
            404
          </h5>

          <p>
            The page you are looking for does not exist.
          </p>
          <br />
          <p>
            <Link className="button button-light" to={path}>Go Back</Link>
          </p>
        </div>
      )
    }
  }
)
