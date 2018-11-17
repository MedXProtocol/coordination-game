import React, { Component } from 'react'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get, range } from 'lodash'
import {
  cacheCall,
  cacheCallValue,
  cacheCallValueInt,
  contractByName,
  withSaga,
  withSend
} from 'saga-genesis'
import { isBlank } from '~/utils/isBlank'
import { ExportOutline } from '@ant-design/icons'
import AntdIcon from '@ant-design/icons-react'
import { ApplicantApplicationRow } from '~/components/Applicants/ApplicantApplicationRow'
import { ExportCSVControls } from '~/components/ExportCSVControls'
import { LoadingLines } from '~/components/LoadingLines'
import { mapToGame } from '~/services/mapToGame'
import { retrieveApplicationDetailsFromLocalStorage } from '~/services/retrieveApplicationDetailsFromLocalStorage'

function mapStateToProps(state) {
  let applicationObjects = []

  const networkId = get(state, 'sagaGenesis.network.networkId')
  const transactions = get(state, 'sagaGenesis.transactions')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')

  const applicationCount = cacheCallValueInt(state, coordinationGameAddress, 'getApplicantsApplicationCount', address)

  if (applicationCount && applicationCount !== 0) {
    // The -1 logic here is weird, range is exclusive not inclusive:
    applicationObjects = range(applicationCount, -1).reduce((accumulator, index) => {
      const applicationId = cacheCallValue(
        state,
        coordinationGameAddress,
        "applicantsApplicationIndices",
        address,
        index
      )
      const game = mapToGame(cacheCallValue(state, coordinationGameAddress, 'games', applicationId))
      const { createdAt } = game

      if (!isBlank(applicationId) && createdAt) {
        accumulator.push({ applicationId, createdAt })
      }

      return accumulator
    }, [])
  }

  return {
    applicationCount,
    applicationObjects,
    address,
    coordinationGameAddress,
    networkId,
    transactions
  }
}

function* applicantApplicationsTableSaga({
  coordinationGameAddress,
  address,
  applicationCount
}) {
  if (!coordinationGameAddress || !address) { return null }

  yield all([
    cacheCall(coordinationGameAddress, 'getApplicantsApplicationCount', address)
  ])

  if (applicationCount && applicationCount !== 0) {
    const indices = range(applicationCount)
    yield all(
      indices.map(function*(index) {
        const applicationId = yield cacheCall(coordinationGameAddress, "applicantsApplicationIndices", address, index)

        if (!isBlank(applicationId)) {
          yield cacheCall(coordinationGameAddress, 'games', applicationId)
        }
      })
    )
  }
}

export const ApplicantApplicationsTable = connect(mapStateToProps)(
  withSaga(applicantApplicationsTableSaga)(
    withSend(
      class _ApplicantApplicationsTable extends Component {

        constructor(props) {
          super(props)

          this.state = {
            showCsvLink: false,
            csvData: []
          }
        }

        csvData = () => {
          const data = []

          this.props.applicationObjects.forEach((applicationObject) => {
            let appObject = {
              applicationId: applicationObject.applicationId,
              hint: 'unknown',
              random: 'unknown',
              secret: 'unknown'
            }

            appObject = retrieveApplicationDetailsFromLocalStorage(
              appObject,
              this.props.networkId,
              this.props.address,
              applicationObject.createdAt
            )

            data.push(appObject)
          })

          return data
        }

        renderApplicationRows(applicationObjects) {
          // renderApplicationRows(applicationObjects, transactions, applicationCount) {
          let applicationRows = applicationObjects.map((applicationObject, index) => {
            return (
              <ApplicantApplicationRow
                applicationId={applicationObject.applicationId}
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

        exportAll = (e) => {
          e.preventDefault()

          this.setState({
            showCsvLink: true
          })
        }

        render() {
          let noApplications, loadingLines, applicationRows
          const { applicationObjects, applicationCount } = this.props
          const loading = applicationCount === undefined

          if (loading) {
            loadingLines = (
              <div className="blank-state">
                <div className="blank-state--inner has-text-grey">
                  <LoadingLines visible={true} />
                </div>
              </div>
            )
          } else if (!applicationObjects.length) {
            noApplications = (
              <div className="blank-state">
                <div className="blank-state--inner has-text-grey">
                  <span className="is-size-6">You have not applied yet.</span>
                </div>
              </div>
            )
          } else {
            applicationRows = (
              this.renderApplicationRows(applicationObjects)
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
                  <AntdIcon type={ExportOutline} className="antd-icon icon-export" />&nbsp;
                  Export a Backup
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
