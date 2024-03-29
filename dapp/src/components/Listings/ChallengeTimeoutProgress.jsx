import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import distanceInWords from 'date-fns/distance_in_words'

export class ChallengeTimeoutProgress extends PureComponent {
  static propTypes = {
    challenge: PropTypes.object.isRequired,
    latestBlockTimestamp: PropTypes.any.isRequired,
    timeout: PropTypes.any.isRequired
  }

  render () {
    let timePercentage
    
    const {
      challenge,
      latestBlockTimestamp,
      timeout
    } = this.props

    const currentTime = parseInt(latestBlockTimestamp, 10)
    const roundEndAt = parseInt(challenge.updatedAt, 10) + parseInt(timeout, 10)

    const timeRemainingWords = distanceInWords(new Date(currentTime * 1000), new Date(roundEndAt * 1000))
    const timeRemaining = roundEndAt - currentTime

    timePercentage = parseInt((timeRemaining * 100) / timeout, 10)
    if (isNaN(timePercentage)) {
      timePercentage = 0
    }

    return (
      <div className='approve-progress'>
        <br />
        <h4 className='is-size-6'>
          Time Remaining
        </h4>
        <div className='challenge-progress__progress-container'>
          <div className='challenge-progress__progress-container__time-label'>
            {timeRemainingWords}
          </div>
          <progress
            className='progress is-info'
            value={timePercentage}
            max='100'
          >
          </progress>
        </div>
        <br />
      </div>
    )
  }
}
