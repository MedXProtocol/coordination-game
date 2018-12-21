import React from 'react'
import { hexHintToTokenData } from '~/utils/hexHintToTokenData'
import { bytes32ToTicker } from '~/utils/bytes32ToTicker'

export const HintStatus = function ({ applicationId, hint }) {
  const tokenName = hexHintToTokenData(hint)
  const tokenTicker = bytes32ToTicker(applicationId)

  if (tokenName && tokenTicker) {
    var statusText = (
      <React.Fragment>
        Project Name: <strong>{tokenName}</strong>
        <br />
        Token Ticker: <strong>{tokenTicker}</strong>
      </React.Fragment>
    )
  } else {
    statusText = (
      <abbr
        data-for='hint-random-secret-tooltip'
        data-tip="Could not find data. Possibly saved in another Web3 browser?"
      >
        not available
      </abbr>
    )
  }
  return statusText
}
