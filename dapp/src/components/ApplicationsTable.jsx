import React, { Component } from 'react'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get, range } from 'lodash'
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
import { ApplicationRow } from '~/components/ApplicationRow'
import { LoadingLines } from '~/components/LoadingLines'

function mapStateToProps(state) {
  let applicationIds = []
  let applicantsApplicationIndices

  const transactions = get(state, 'sagaGenesis.transactions')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')

  const applicationCount = cacheCallValueInt(state, coordinationGameAddress, 'getApplicantsApplicationCount')
  // console.log('applicationCount', applicationCount)

  if (applicationCount && applicationCount !== 0) {

    // The -1 logic here is weird, range is exclusive not inclusive:
    applicationIds = range(applicationCount, -1).reduce((accumulator, index) => {
      const applicationId = cacheCallValueInt(
        state,
        coordinationGameAddress,
        "applicantsApplicationIndices",
        address,
        index
      )

      if (applicationId) {
        accumulator.push(applicationId)
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
    // console.log(indices)
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

        renderApplicationRows(applicationIds) {
        // renderApplicationRows(applicationIds, transactions, applicationCount) {
          let applicationRows = applicationIds.map((applicationId, index) => {
            return (
              <ApplicationRow
                applicationId={applicationId}
                key={`application-row-${index}`}
              />
            )
          })

          // let objIndex = applicationCount + 1
          // transactions.forEach(transaction => {
          //   const applicationRowObject = addPendingTx(transaction, objIndex)
          //
          //   if (applicationRowObject) {
          //     applicationRows.push(
          //       <ApplicationRow
          //         applicationRowObject={applicationRowObject}
          //         objIndex={objIndex}
          //         key={`new-application-row-${objIndex}`}
          //       />
          //     )
          //
          //     objIndex++
          //   }
          // })

          return applicationRows.reverse()
        }

        render() {
          let noApplications, loadingLines, applicationRows
          const { applicationIds, applicationCount } = this.props
          const loading = this.props.applicationCount === undefined

          if (loading) {
            loadingLines = (
              <div className="blank-state">
                <div className="blank-state--inner text-center text-gray">
                  <LoadingLines visible={true} />
                </div>
              </div>
            )
          } else if (!applicationIds.length) {
            noApplications = (
              <div className="blank-state">
                <div className="blank-state--inner text-center text-gray">
                  <span className="is-size-6">You have not applied yet.</span>
                </div>
              </div>
            )
          } else {
            applicationRows = (
              this.renderApplicationRows(applicationIds)
            )
          }

          return (
            <div className="list--container">
              {loadingLines}
              {noApplications}

              <div className="list">
                {applicationRows}
              </div>
            </div>
          )
        }
      }
    )
  )
)
