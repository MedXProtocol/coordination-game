import React, { PureComponent } from 'react'
import BN from 'bn.js'
import { TEX } from '~/components/Helpers/TEX'
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
        <hr />
        <h4 className='is-size-6'>
          Current Vote Weighting:
        </h4>
        <div className='challenge-progress__progress-container'>
          <div className='challenge-progress__progress-container__challenge-label'>
            Remove Listing
            <br className="is-hidden-desktop" />
            <span className="is-hidden-touch"> &mdash; </span>
            <TEX wei={challengeTotal} />
          </div>
          <div className='challenge-progress__progress-container__approve-label'>
            Keep Listing
            <br className="is-hidden-desktop" />
            <span className="is-hidden-touch"> &mdash; </span>
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
