import React, { Component } from 'react'
import { PageTitle } from '~/components/PageTitle'

export const VerifierStake = class _VerifierStake extends Component {
  render() {
    return (
      <div>
        <PageTitle title='stake' />
        <div className='container'>
          <div className="card">
            <div className="row">
              <div className="col-xs-12">
                <br />
                <h1 className="title text-center">
                  Stake
                </h1>
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }
}
