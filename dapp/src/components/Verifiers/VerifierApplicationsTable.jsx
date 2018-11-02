import React, { Component } from 'react'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get, range } from 'lodash'
import {
  cacheCall,
  cacheCallValueInt,
  contractByName,
  withSaga
} from 'saga-genesis'
import { VerifierApplicationRow } from '~/components/Verifiers/VerifierApplicationRow'
import { LoadingLines } from '~/components/LoadingLines'

function mapStateToProps(state) {
  let applicationIds = []

  const networkId = get(state, 'sagaGenesis.network.networkId')
  const transactions = get(state, 'sagaGenesis.transactions')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')

  const applicationCount = cacheCallValueInt(state, coordinationGameAddress, 'getVerifiersApplicationCount')

  if (applicationCount && applicationCount !== 0) {
    // The -1 logic here is weird, range is exclusive not inclusive:
    applicationIds = range(applicationCount, -1).reduce((accumulator, index) => {
      const applicationId = cacheCallValueInt(
        state,
        coordinationGameAddress,
        "verifiersApplicationIndices",
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
    networkId,
    transactions
  }
}

function* verifierApplicationsTableSaga({
  coordinationGameAddress,
  address,
  applicationCount
}) {
  if (!coordinationGameAddress || !address) { return null }

  yield all([
    cacheCall(coordinationGameAddress, 'getVerifiersApplicationCount')
  ])

  if (applicationCount && applicationCount !== 0) {
    const indices = range(applicationCount)
    yield all(
      indices.map(function*(index) {
        yield cacheCall(coordinationGameAddress, "verifiersApplicationIndices", address, index)
      })
    )
  }
}

export const VerifierApplicationsTable = connect(mapStateToProps)(
  withSaga(verifierApplicationsTableSaga)(
    class _VerifierApplicationsTable extends Component {

      renderApplicationRows(applicationIds) {
        let applicationRows = applicationIds.map((applicationId, index) => {
          return (
            <VerifierApplicationRow
              applicationId={applicationId}
              key={`application-row-${index}`}
            />
          )
        })

        return applicationRows.reverse()
      }

      render() {
        let noApplications, loadingLines, applicationRows
        const { applicationIds, applicationCount } = this.props
        const loading = applicationCount === undefined

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
                <span className="is-size-6">You currently have no applications to verify.</span>
              </div>
            </div>
          )
        } else {
          applicationRows = (
            this.renderApplicationRows(applicationIds)
          )
        }

        return (
          <React.Fragment>
            <div className="is-clearfix">
              <h6 className="is-size-6">
                Your Applications to Verify:
              </h6>
            </div>

            <div className={classnames(
              'list--container',
              {
                'list--container__top-borderless': this.props.topBorderless
              }
            )}>
              {loadingLines}
              {noApplications}

              <div className="list">
                {applicationRows}
              </div>
            </div>
          </React.Fragment>
        )
      }
    }
  )
)
