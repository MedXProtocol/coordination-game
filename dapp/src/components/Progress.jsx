import React from 'react'
import classnames from 'classnames'

export function Progress({ progressState, labels }) {
  let step4

  if (labels[3]) {
    step4 = (
      <div className={classnames(
        'progress--step', {
          'is-active': progressState.step4Active,
          'is-complete': progressState.step4Complete
        }
      )}>
        {labels[3]}
      </div>
    )
  }

  return (
    <div className="progress--container">
      <div className="progress--track"></div>

      <div className={classnames(
        'progress--step', {
          'is-active': progressState.step1Active,
          'is-complete': progressState.step1Complete
        }
      )}>
        {labels[0]}
      </div>
      <div className={classnames(
        'progress--step', {
          'is-active': progressState.step2Active,
          'is-complete': progressState.step2Complete
        }
      )}>
        {labels[1]}
      </div>
      <div className={classnames(
        'progress--step', {
          'is-active': progressState.step3Active,
          'is-complete': progressState.step3Complete
        }
      )}>
        {labels[2]}
      </div>

      {step4}
    </div>
  )
}

//  <button onClick=next()>Next Step</button>
