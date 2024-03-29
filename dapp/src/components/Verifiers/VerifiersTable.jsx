import React, { PureComponent } from 'react'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { get, range } from 'lodash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import {
  cacheCall,
  cacheCallValue,
  cacheCallValueInt,
  contractByName,
  withSaga
} from 'saga-genesis'
import { EtherscanLink } from '~/components/Helpers/EtherscanLink'
import { EthAddress } from '~/components/Helpers/EthAddress'
import { LoadingLines } from '~/components/Helpers/LoadingLines'
import { isBlank } from '~/utils/isBlank'

function mapStateToProps(state) {
  let verifierAddresses = []

  const address = get(state, 'sagaGenesis.accounts[0]')
  const networkId = get(state, 'sagaGenesis.network.networkId')
  const transactions = get(state, 'sagaGenesis.transactions')

  const workAddress = contractByName(state, 'Work')

  const verifierCount = cacheCallValueInt(state, workAddress, 'getVerifiersCount')

  if (verifierCount && verifierCount !== 0) {
    // The -1 logic here is weird, range is exclusive not inclusive:
    verifierAddresses = range(verifierCount, -1).reduce((accumulator, index) => {
      const verifierAddress = cacheCallValue(state, workAddress, "getVerifierByIndex", index)

      if (!isBlank(verifierAddress)) {
        accumulator.push(verifierAddress)
      }

      return accumulator
    }, [])
  }

  return {
    verifierCount,
    verifierAddresses,
    address,
    workAddress,
    networkId,
    transactions
  }
}

function* verifiersTableSaga({
  workAddress,
  address,
  verifierCount
}) {
  if (!workAddress) { return null }

  yield cacheCall(workAddress, 'getVerifiersCount')

  if (verifierCount && verifierCount !== 0) {
    const indices = range(verifierCount)
    yield all(
      indices.map(function* (index) {
        yield cacheCall(workAddress, "getVerifierByIndex", index)
      })
    )
  }
}

export const VerifiersTable = connect(mapStateToProps)(
  withSaga(verifiersTableSaga)(
    class _VerifiersTable extends PureComponent {

      renderApplicationRows(verifierAddresses) {
        let applicationRows = verifierAddresses.map((verifierAddress, index) => {
          return (
            <div key={`verifier-${index}`} className={classnames(
              'list--item',
            )}>
              <span className="list--item__id">
                #{index + 1}
              </span>

              <span className="list--item__status">
                <EthAddress address={verifierAddress} />
                &nbsp;&nbsp;
                <EtherscanLink address={verifierAddress}>
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                </EtherscanLink>
              </span>
            </div>
          )
        })

        return applicationRows.reverse()
      }

      render() {
        let noApplications, loadingLines, applicationRows
        const { verifierAddresses, verifierCount } = this.props
        const loading = verifierCount === undefined

        if (loading) {
          loadingLines = (
            <div className="blank-state">
              <div className="blank-state--inner has-text-grey">
                <LoadingLines visible={true} />
              </div>
            </div>
          )
        } else if (verifierCount === 0) {
          noApplications = (
            <div className="blank-state">
              <div className="blank-state--inner has-text-grey">
                <span className="is-size-6">Currently no verifiers.</span>
              </div>
            </div>
          )
        } else {
          applicationRows = (
            this.renderApplicationRows(verifierAddresses)
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
          </React.Fragment>
        )
      }
    }
  )
)
