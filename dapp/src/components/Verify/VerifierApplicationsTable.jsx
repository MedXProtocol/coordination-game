import React, { Component } from 'react'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get, range } from 'lodash'
import {
  cacheCall,
  cacheCallValueInt,
  contractByName,
  withSaga,
  withSend
} from 'saga-genesis'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExport } from '@fortawesome/free-solid-svg-icons'
import { ApplicationRow } from '~/components/ApplicationRow'
import { ExportCSVControls } from '~/components/ExportCSVControls'
import { LoadingLines } from '~/components/LoadingLines'
import { storageAvailable } from '~/services/storageAvailable'
import { applicationStorageKey } from '~/utils/applicationStorageKey'

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
    withSend(
      class _VerifierApplicationsTable extends Component {

        constructor(props) {
          super(props)

          this.state = {
            showCsvLink: false,
            csvData: []
          }
        }

        csvData = () => {
          const data = []

          this.props.applicationIds.forEach((applicationId) => {
            let applicationData = {
              applicationId,
              hint: 'unknown',
              random: 'unknown',
              secret: 'unknown'
            }

            if (storageAvailable('localStorage')) {
              const key = applicationStorageKey(this.props.networkId, applicationId)
              const applicationJson = localStorage.getItem(key)

              if (applicationJson) {
                applicationData = JSON.parse(applicationJson)
              }
            } else {
              console.warn('Unable to read from localStorage')
            }

            data.push(applicationData)
          })

          return data
        }

        renderApplicationRows(applicationIds) {
          let applicationRows = applicationIds.map((applicationId, index) => {
            return (
              <ApplicationRow
                applicationId={applicationId}
                key={`application-row-${index}`}
              />
            )
          })

          return applicationRows.reverse()
        }

        exportAll = (e) => {
          e.preventDefault()

          this.setState({
            showCsvLink: true
          })
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

              <div
                className={classnames(
                  'is-pulled-right',
                  { 'is-hidden': this.state.showCsvLink || !this.props.applicationCount || this.props.applicationCount === 0 }
                )}
              >
                <button onClick={this.exportAll} className="is-size-7">
                  <FontAwesomeIcon
                    icon={faFileExport}
                  /> Export a Backup
                </button>
              </div>

              <ExportCSVControls
                showCsvLink={this.state.showCsvLink}
                csvData={this.csvData()}
                headers={[
                  { label: "Application ID#", key: "applicationId" },
                  { label: "Hint", key: "hint" },
                  { label: "Random #", key: "random" },
                  { label: "Secret", key: "secret" }
                ]}
              />
            </React.Fragment>
          )
        }
      }
    )
  )
)
