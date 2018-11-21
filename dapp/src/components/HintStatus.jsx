import React from 'react'
import { hexHintToTokenData } from '~/utils/hexHintToTokenData'

export const HintStatus = function ({ hexHint }) {
  const [tokenTicker, tokenName] = hexHintToTokenData(hexHint)

  if (tokenName && tokenTicker) {
    var statusText = (
      <React.Fragment>
        Token Name: <strong>{tokenName}</strong>
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
