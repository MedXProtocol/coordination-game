import React, { PureComponent } from 'react'
import classnames from 'classnames'
import { toBN } from '~/utils/toBN'
import { TEX } from '~/components/TEX.jsx'
import PropTypes from 'prop-types'

export class ContributionProgress extends PureComponent {
  static propTypes = {
    challenge: PropTypes.object.isRequired,
    total: PropTypes.object,
    progressClassName: PropTypes.string
  }

  static defaultProps = {
    progressClassName: 'is-danger'
  }

  render () {
    const {
      total,
      challenge
    } = this.props
    const {
      challengeTotal,
      approveTotal,
    } = challenge

    const stakedTotal = challengeTotal.add(approveTotal)
    const percentage = toBN(total).mul(toBN(100)).div(stakedTotal)

    return (
      <div className='challenge-progress'>
        <h4 className='is-size-6'>Your contribution <small className='has-text-grey'><TEX wei={total} /></small></h4>
        <progress
          className={classnames('progress', this.props.progressClassName)}
          value={percentage.toString()}
          max='100'>
        </progress>
      </div>
    )
  }
}
