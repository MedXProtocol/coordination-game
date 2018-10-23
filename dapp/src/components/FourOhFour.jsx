import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { PageTitle } from '~/components/PageTitle'
import * as routes from '~/../config/routes'

export const FourOhFour = class _FourOhFour extends Component {
  render() {
    let path = routes.HOME

    return (
      <div>
        <PageTitle title='fourOhFour' />
        <div className='container'>
          <div className="card">
            <div className="row">
              <div className="col-xs-12">
                <br />
                <h1 className="title text-center">
                  404
                </h1>
              </div>
            </div>

            <div className="card-body">
              <div className='row'>
                <div className='col-xs-12 text-center'>
                  <p className='lead'>
                    The page you are looking for does not exist.
                  </p>
                  <hr />
                  <p>
                    <Link className="button button-light" to={path}>Go Back</Link>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }
}
