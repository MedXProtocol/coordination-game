import React from 'react'
import { bytes32ToTicker } from '~/utils/bytes32ToTicker'

export const AppId = function ({applicationId}) {
  const number = bytes32ToTicker(applicationId)
  return (
    <span>${number}</span>
  )
}
