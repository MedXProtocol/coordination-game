import React from 'react'
import DocumentTitle from 'react-document-title'

const titles = {
  home: 'Home - Trustless Incentivized List Demo - Powered by MedX Protocol',
  apply: 'Apply - Trustless Incentivized List Demo - Powered by MedX Protocol',
  stake: 'Stake - Trustless Incentivized List Demo - Powered by MedX Protocol',
  wallet: 'Wallet - Trustless Incentivized List Demo - Powered by MedX Protocol',
  fourOhFour: '404 - Trustless Incentivized List Demo - Powered by MedX Protocol'
}

export function PageTitle({ title }) {
  return (
    <DocumentTitle title={titles[title]} />
  )
}
