import React from 'react'
import classnames from 'classnames'

export const LoadingLines = props => (
  <div className={classnames('loader', { 'hidden': !props.visible })}>
    <div className="loader-inner line-scale">
    </div>
  </div>
)
