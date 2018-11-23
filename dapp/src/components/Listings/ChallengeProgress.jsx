import React, { PureComponent } from 'react'
import BN from 'bn.js'
import { TEX } from '~/components/TEX.jsx'
import PropTypes from 'prop-types'

export class ChallengeProgress extends PureComponent {
  static propTypes = {
    challenge: PropTypes.object.isRequired
  }

  render () {
    const {
      challengeTotal,
      approveTotal
    } = this.props.challenge
    const total = challengeTotal.add(approveTotal)
    const challengePercentage = challengeTotal.mul(new BN(100)).div(total)

    return (
      <div className='challenge-progress'>
        <div className='challenge-progress__progress-container'>
          <div className='challenge-progress__progress-container__challenge-label'>
            Challenge Listing <br />
            <TEX wei={challengeTotal} />
          </div>
          <div className='challenge-progress__progress-container__approve-label'>
            Reject Challenge <br />
            <TEX wei={approveTotal} />
          </div>
          <progress
            className='progress is-danger'
            value={challengePercentage.toString()}
            max='100'>
            {challengeTotal.toString()}
          </progress>
        </div>
      </div>
    )
  }
}
