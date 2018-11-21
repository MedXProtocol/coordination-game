import React, { Component } from 'react'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { withRouter } from 'react-router-dom'
import { get, range } from 'lodash'
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
import { ExportCSVControls } from '~/components/ExportCSVControls'
import { LoadingLines } from '~/components/LoadingLines'
import { Pagination } from '~/components/Pagination'
import { formatPageRouteQueryParams } from '~/services/formatPageRouteQueryParams'
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
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')

  const applicationCount = cacheCallValueInt(state, coordinationGameAddress, 'getApplicantsApplicationCount', address)

  if (applicationCount && applicationCount !== 0) {
    const startIndex = (parseInt(currentPage, 10) - 1) * pageSize
    const endIndex = startIndex + pageSize

    totalPages = Math.ceil(applicationCount / pageSize)

    applicationObjects = range(startIndex, endIndex).reduce((accumulator, index) => {
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
    totalPages,
    transactions
  }
}

function* applicantApplicationsTableSaga({
  coordinationGameAddress,
  address,
  applicationCount
}) {
  if (!coordinationGameAddress || !address) { return null }

  yield cacheCall(coordinationGameAddress, 'getApplicantsApplicationCount', address)

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
