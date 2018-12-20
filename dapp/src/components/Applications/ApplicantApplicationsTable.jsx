import React, { Component } from 'react'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { withRouter } from 'react-router-dom'
import { get, range, sortBy } from 'lodash'
import PropTypes from 'prop-types'
import { ExportOutline } from '@ant-design/icons'
import AntdIcon from '@ant-design/icons-react'
import {
  cacheCall,
  cacheCallValue,
  cacheCallValueInt,
  contractByName,
  withSaga,
  withSend
} from 'saga-genesis'
import { ApplicationRow } from '~/components/Applications/ApplicationRow'
import { ExportCSVControls } from '~/components/Applications/ExportCSVControls'
import { LoadingLines } from '~/components/Helpers/LoadingLines'
import { Pagination } from '~/components/Helpers/Pagination'
import { formatPageRouteQueryParams } from '~/services/formatPageRouteQueryParams'
import { applicationService } from '~/services/applicationService'
import { mapApplicationState } from '~/services/mapApplicationState'
import { mapToGame } from '~/services/mapToGame'
import { retrieveApplicationDetailsFromLocalStorage } from '~/services/retrieveApplicationDetailsFromLocalStorage'
import { isBlank } from '~/utils/isBlank'
import * as routes from '~/../config/routes'

function mapStateToProps(state, { currentPage, pageSize }) {
  let totalPages
  let applicationObjects = []

  const networkId = get(state, 'sagaGenesis.network.networkId')
  const transactions = get(state, 'sagaGenesis.transactions')
  const address = get(state, 'sagaGenesis.accounts[0]')
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')
  const latestBlockNumber = get(state, 'sagaGenesis.block.latestBlock.number')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const tilRegistryAddress = contractByName(state, 'TILRegistry')

  const applicationCount = cacheCallValueInt(state, coordinationGameAddress, 'getApplicantsApplicationCount', address)
  const verifierTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'verifierTimeoutInSeconds')
  const applicantRevealTimeoutInSeconds = cacheCallValueInt(state, coordinationGameAddress, 'applicantRevealTimeoutInSeconds')

  if (applicationCount && applicationCount !== 0) {
    const startIndex = (parseInt(currentPage, 10) - 1) * pageSize
    const endIndex = startIndex + pageSize

    totalPages = Math.ceil(applicationCount / pageSize)

    applicationObjects = range(startIndex, endIndex).reduce((accumulator, index) => {
      const applicationId = cacheCallValue(
        state,
        coordinationGameAddress,
        "getApplicantsApplicationAtIndex",
        address,
        index
      )

      const game = mapToGame(cacheCallValue(state, coordinationGameAddress, 'games', applicationId))
      const { createdAt, updatedAt } = game

      if (!isBlank(applicationId) && createdAt) {
        const applicationObject = applicationService(state, applicationId, coordinationGameAddress, tilRegistryAddress)
        const applicationState = mapApplicationState(address, applicationObject, latestBlockNumber, latestBlockTimestamp)

        const { verifierSubmittedAt } = applicationObject
        const { priority } = applicationState

        accumulator.push({ applicationId, createdAt, updatedAt, verifierSubmittedAt, priority })
      }

      return accumulator
    }, [])

    applicationObjects = sortBy(applicationObjects, (obj => obj.priority)).reverse()
  }

  return {
    applicationCount,
    applicationObjects,
    applicantRevealTimeoutInSeconds,
    address,
    coordinationGameAddress,
    networkId,
    totalPages,
    transactions,
    verifierTimeoutInSeconds
  }
}

function* applicantApplicationsTableSaga({
  coordinationGameAddress,
  address,
  applicationCount
}) {
  if (!coordinationGameAddress || !address) { return null }

  yield all([
    cacheCall(coordinationGameAddress, 'getApplicantsApplicationCount', address),
    cacheCall(coordinationGameAddress, 'verifierTimeoutInSeconds'),
    cacheCall(coordinationGameAddress, 'applicantRevealTimeoutInSeconds')
  ])

  if (applicationCount && applicationCount !== 0) {
    const indices = range(applicationCount)
    yield all(
      indices.map(function*(index) {
        const applicationId = yield cacheCall(coordinationGameAddress, "getApplicantsApplicationAtIndex", address, index)

        if (!isBlank(applicationId)) {
          yield all([
            cacheCall(coordinationGameAddress, 'games', applicationId),
            cacheCall(coordinationGameAddress, 'verifications', applicationId)
          ])
        }
      })
    )
  }
}

export const ApplicantApplicationsTable = connect(mapStateToProps)(
  withSaga(applicantApplicationsTableSaga)(
    withSend(
      withRouter(
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

              appObject.random = appObject.random.toString()

              data.push(appObject)
            })

            return data
          }

          renderApplicationRows(applicationObjects) {
            let applicationRows = applicationObjects.map((applicationObject, index) => {
              return (
                <ApplicationRow
                  applicationId={applicationObject.applicationId}
                  key={`application-row-${index}`}
                />
              )
            })

            return applicationRows
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
              applicationRows = this.renderApplicationRows(applicationObjects)
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

                  <Pagination
                    currentPage={parseInt(this.props.currentPage, 10)}
                    totalPages={this.props.totalPages}
                    linkTo={(number, location) => formatPageRouteQueryParams(
                      routes.REGISTER_TOKEN,
                      'applicantApplicationsTableCurrentPage',
                      number,
                      location
                    )}
                  />
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
)

ApplicantApplicationsTable.propTypes = {
  pageSize: PropTypes.number.isRequired,
  currentPage: PropTypes.any
}

ApplicantApplicationsTable.defaultProps = {
  pageSize: 5,
  currentPage: 1
}
