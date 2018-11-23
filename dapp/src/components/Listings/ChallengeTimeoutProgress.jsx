import React, { PureComponent } from 'react'
import BN from 'bn.js'
import PropTypes from 'prop-types'
import distanceInWords from 'date-fns/distance_in_words'

export class ChallengeTimeoutProgress extends PureComponent {
  static propTypes = {
    challenge: PropTypes.object.isRequired,
    latestBlockTimestamp: PropTypes.any.isRequired,
    timeout: PropTypes.any.isRequired
  }

  render () {
    const {
      challenge,
      latestBlockTimestamp,
      timeout
    } = this.props

    const currentTime = parseInt(latestBlockTimestamp, 10)
    const roundEndAt = parseInt(challenge.updatedAt, 10) + parseInt(timeout, 10)

    const timeRemainingWords = distanceInWords(new Date(currentTime * 1000), new Date(roundEndAt * 1000))
    const timeRemaining = roundEndAt - currentTime

    const timePercentage = parseInt((timeRemaining * 100) / timeout, 10)

    return (
      <div className='approve-progress'>
        <h4 className='is-size-6'>Time Remaining <small className='has-text-grey'>{timeRemainingWords}</small></h4>
        <progress
          className='progress is-info'
          value={timePercentage}
          max='100'>
        </progress>
      </div>
    )
  }
}
