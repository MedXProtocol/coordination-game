import React, { PureComponent } from 'react'
import BN from 'bn.js'
import { TEX } from '~/components/Helpers/TEX'
import PropTypes from 'prop-types'

export class ApproveProgress extends PureComponent {
  static propTypes = {
    challenge: PropTypes.object.isRequired
  }

  render () {
    const {
      challengeTotal,
      approveTotal
    } = this.props.challenge
    const total = challengeTotal.add(approveTotal)
    const approvePercentage = approveTotal.mul(new BN(100)).div(total)

    return (
      <div className='approve-progress'>
        <h4 className='is-size-6'>Reject Challenge and Keep Listing <small className='has-text-grey'><TEX wei={approveTotal} /></small></h4>
        <progress
          className='progress is-success'
          value={approvePercentage.toString()}
          max='100'>
          {approveTotal.toString()}
        </progress>
      </div>
    )
  }
}
