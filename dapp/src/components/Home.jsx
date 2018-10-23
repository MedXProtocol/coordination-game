import React, { Component } from 'react'
import { PageTitle } from '~/components/PageTitle'
import { TILTable } from '~/components/TILTable'

export const Home = class _Home extends Component {
  render() {
    return (
      <React.Fragment>
        <PageTitle title='home' />

        <TILTable />
      </React.Fragment>
    )
  }
}
