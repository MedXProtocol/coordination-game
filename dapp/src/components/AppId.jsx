import React from 'react'
import { getWeb3 } from '~/utils/getWeb3'

export const AppId = function ({applicationId}) {
  const number = getWeb3().utils.hexToNumber(applicationId)
  return (
    <span>#{number}</span>
  )
}
