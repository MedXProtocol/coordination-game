import React, { Component } from 'react'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get } from 'lodash'
import {
  cacheCall,
  // cacheCallValue,
  // cacheCallValueBigNumber,
  contractByName,
  withSaga
} from 'saga-genesis'
// import { displayWeiToEther } from '~/utils/displayWeiToEther'
// import { getWeb3 } from '~/utils/getWeb3'

function mapStateToProps(state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const transactions = get(state, 'sagaGenesis.transactions')
  const workAddress = contractByName(state, 'Work')
  const workTokenAddress = contractByName(state, 'WorkToken')

  // const stakers = cacheCallValue(state, 'Work', 'stakers')

  // for
    // const staked = cacheCallValueBigNumber(state, workAddress, 'balances', address)

  return {
    address,
    // stakers,
    // staked,
    transactions,
    workAddress,
    workTokenAddress
  }
}

function* tilTableSaga({ address, workTokenAddress, workAddress }) {
  if (!address || !workTokenAddress || !workAddress) { return }

  yield all([
    cacheCall(workTokenAddress, 'balanceOf', address)//,
    // cacheCall(workAddress, 'stakers')
  ])
}

export const TILTable = connect(mapStateToProps)(
  withSaga(tilTableSaga)(
    class _TILTable extends Component {

      render() {
        return (
          <div className="entries has-text-centered">
            <table className="table is-fullwidth">
              <thead>
                <tr>
                  <th></th>
                  <th>Application #</th>
                  <th>Hint</th>
                  <th>Secret</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>May 31st, 2018</th>
                  <th>1</th>
                  <th>200 + 200</th>
                  <th>400</th>
                  <th>Verified</th>
                </tr>
                <tr>
                  <th>June 2nd, 2018</th>
                  <th>2</th>
                  <th>300 + 2</th>
                  <th>5693</th>
                  <th>Rejected</th>
                </tr>
                <tr>
                  <th>July 20th, 2018</th>
                  <th>3</th>
                  <th>342 + 182</th>
                  <th>3</th>
                  <th>Challenged</th>
                </tr>
              </tbody>
            </table>
          </div>
        )
      }
    }
  )
)
