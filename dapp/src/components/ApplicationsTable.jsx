import React, { Component } from 'react'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get, range } from 'lodash'
import BN from 'bn.js'
import { Flipper, Flipped } from 'react-flip-toolkit'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import {
  cacheCall,
  cacheCallValue,
  cacheCallValueInt,
  cacheCallValueBigNumber,
  contractByName,
  TransactionStateHandler,
  withSaga,
  withSend
} from 'saga-genesis'
import { toastr } from '~/toastr'
import { transactionFinders } from '~/finders/transactionFinders'
import { GetTILWLink } from '~/components/GetTILWLink'
import { LoadingLines } from '~/components/LoadingLines'
import { PageTitle } from '~/components/PageTitle'
import { ScrollToTop } from '~/components/ScrollToTop'
import { getWeb3 } from '~/utils/getWeb3'
import { etherToWei } from '~/utils/etherToWei'
import { weiToEther } from '~/utils/weiToEther'

function mapStateToProps(state) {
  let applicationIds = []
  let verifier, applicantsApplicationIndices

  const transactions = get(state, 'sagaGenesis.transactions')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')

  const applicationCount = cacheCallValueInt(state, coordinationGameAddress, 'getApplicantsApplicationCount')
  // console.log('applicationCount', applicationCount)

  if (applicationCount && applicationCount !== 0) {
    // index at 1 doesn't make sense:

    // verifier = cacheCallValue(state, coordinationGameAddress, 'verifiers', applicationCount)
    // applicantsApplicationIndices = cacheCall(state, coordinationGameAddress, 'applicantsApplicationIndices', address, 1)
    // console.log('verifier', verifier)

    applicationIds = range(applicationCount, -1).reduce((accumulator, index) => {
      const applicationId = cacheCallValue(
        state,
        coordinationGameAddress,
        "applicantsApplicationIndices",
        address,
        index
      )

      if (applicationId) {
        accumulator.push(applicationId)

        const verifier = cacheCallValue(
          state,
          coordinationGameAddress,
          "verifiers",
          applicationId
        )
        console.log(verifier)
      }

      return accumulator
    }, [])
  }

  return {
    applicationCount,
    applicationIds,
    address,
    coordinationGameAddress,
    transactions
  }
}

function* applicationsTableSaga({
  coordinationGameAddress,
  address,
  applicationCount
}) {
  if (!coordinationGameAddress || !address) { return null }

  yield all([
    cacheCall(coordinationGameAddress, 'getApplicantsApplicationCount')
  ])

  if (applicationCount && applicationCount !== 0) {

    const indices = range(applicationCount)
    console.log(indices)
    yield all(
      indices.map(function*(index) {
        const applicationId = yield cacheCall(coordinationGameAddress, "applicantsApplicationIndices", address, index)

        if (applicationId) {
          yield cacheCall(coordinationGameAddress, 'verifiers', applicationId)
        }
      })
    )
  }
}

export const ApplicationsTable = connect(mapStateToProps)(
  withSaga(applicationsTableSaga)(
    withSend(
      class _ApplicationsTable extends Component {

        render() {
          return (
            <div>
              ApplicationsTable
            </div>
          )
        }
      }
    )
  )
)
