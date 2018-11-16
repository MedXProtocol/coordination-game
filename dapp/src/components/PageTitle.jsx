import React from 'react'
import DocumentTitle from 'react-document-title'

const titles = {
  home: 'Home - Trustless Incentivized List Demo',
  registerToken: 'Register a new Token - Trustless Incentivized List Demo',
  stake: 'Stake - Trustless Incentivized List Demo',
  wallet: 'Wallet - Trustless Incentivized List Demo',
  verify: 'Verify - Trustless Incentivized List Demo',
  faq: 'Frequently Asked Questions - Trustless Incentivized List Demo',
  fourOhFour: '404 - Trustless Incentivized List Demo',
  admin: 'Admin - Trustless Incentivized List Demo'
}

export function PageTitle({ title }) {
  return (
    <DocumentTitle title={titles[title]} />
  )
}
