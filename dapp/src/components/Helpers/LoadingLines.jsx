import React from 'react'
import classnames from 'classnames'

export const LoadingLines = props => (
  <div className={classnames(
    'loader', {
      'is-hidden': !props.visible
    }
  )} />
)
