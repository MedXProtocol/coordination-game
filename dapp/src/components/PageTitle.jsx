import React from 'react'
import DocumentTitle from 'react-document-title'

const titles = {
  challenges: 'Challenges - The Token Registry, a Trustless Incentivized List Demo',
  home: 'Home - The Token Registry, a Trustless Incentivized List Demo',
  registerToken: 'Register a new Token - The Token Registry, a Trustless Incentivized List Demo',
  stake: 'Stake - The Token Registry, a Trustless Incentivized List Demo',
  wallet: 'Wallet - The Token Registry, a Trustless Incentivized List Demo',
  verify: 'Verify - The Token Registry, a Trustless Incentivized List Demo',
  faq: 'Frequently Asked Questions - The Token Registry, a Trustless Incentivized List Demo',
  fourOhFour: '404 - The Token Registry, a Trustless Incentivized List Demo',
  admin: 'Admin - The Token Registry, a Trustless Incentivized List Demo'
}

export function PageTitle({ title }) {
  return (
    <DocumentTitle title={titles[title]} />
  )
}
