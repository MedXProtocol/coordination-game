import React, { PureComponent } from 'react'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { get } from 'lodash'
import {
  cacheCallValueInt,
  contractByName,
  withSaga
} from 'saga-genesis'
import { ApplicationRow } from '~/components/Applications/ApplicationRow'
import { LoadingLines } from '~/components/LoadingLines'
import { verifierApplicationsService } from '~/services/verifierApplicationsService'
import { verifierApplicationsSaga } from '~/sagas/verifierApplicationsSaga'

function mapStateToProps(state) {
  let applicationIds = []

  const networkId = get(state, 'sagaGenesis.network.networkId')
  const transactions = get(state, 'sagaGenesis.transactions')
  const address = get(state, 'sagaGenesis.accounts[0]')

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const applicationCount = cacheCallValueInt(state, coordinationGameAddress, 'getVerifiersApplicationCount', address)

  if (applicationCount && applicationCount !== 0) {
    applicationIds = verifierApplicationsService(state, applicationCount, coordinationGameAddress)
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

export const VerifierApplicationsTable = connect(mapStateToProps)(
  withSaga(verifierApplicationsSaga)(
    class _VerifierApplicationsTable extends PureComponent {

      renderApplicationRows(applicationIds) {
        let applicationRows = applicationIds.map((applicationId, index) => {
          return (
            <ApplicationRow
              applicationId={applicationId}
              key={`verifier-application-row-${applicationId}`}
            />
          )
        })

        return applicationRows
      }

      render() {
        let noApplications, loadingLines, applicationRows
        const { applicationIds, applicationCount } = this.props
        const loading = applicationCount === undefined

        if (loading) {
          loadingLines = (
            <div className="blank-state">
              <div className="blank-state--inner has-text-grey">
                <LoadingLines visible={true} />
              </div>
            </div>
          )
        } else if (!applicationIds.length) {
          noApplications = (
            <div className="blank-state">
              <div className="blank-state--inner has-text-grey">
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
                Submissions pending your review:
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
