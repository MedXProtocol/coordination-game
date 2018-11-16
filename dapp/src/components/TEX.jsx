import React from 'react'
import classnames from 'classnames'
import { displayWeiToEther } from '~/utils/displayWeiToEther'

export function TEX({ wei, noStyle }) {
  return (
    <span className={classnames({ 'currency': !noStyle })}>
      {displayWeiToEther(wei || 0)} TEX
    </span>
  )
}
