import React, {
  PureComponent
} from 'react'
import PropTypes from 'prop-types'
import { all } from 'redux-saga/effects'
import {
  withSaga,
  cacheCall,
  cacheCallValue,
  contractByName
} from 'saga-genesis'
import { connect } from 'react-redux'
import { TILW } from '~/components/TILW'
import { EthAddress } from '~/components/EthAddress'
import { getWeb3 } from '~/utils/getWeb3'

function mapStateToProps(state, { listingHash }) {
  const web3 = getWeb3()
  const TILRegistry = contractByName(state, 'TILRegistry')
  const CoordinationGame = contractByName(state, 'CoordinationGame')
  const listing = cacheCallValue(state, TILRegistry, 'listings', listingHash)
  const applicationId = web3.utils.hexToNumber(listingHash)
  const hint = web3.utils.hexToUtf8(cacheCallValue(state, CoordinationGame, 'hints', applicationId) || '0x')
  const hexSecret = cacheCallValue(state, CoordinationGame, 'applicantSecrets', applicationId)
  const secret = web3.utils.hexToNumber(hexSecret || '0x')
  return {
    TILRegistry,
    CoordinationGame,
    listing,
    applicationId,
    hint,
    secret
  }
}

function* listingRowSaga({ TILRegistry, CoordinationGame, listingHash, applicationId }) {
  if (!TILRegistry || !CoordinationGame || !listingHash || !applicationId) { return }
  yield all([
    cacheCall(TILRegistry, 'listings', listingHash),
    cacheCall(CoordinationGame, 'hints', applicationId),
    cacheCall(CoordinationGame, 'applicantSecrets', applicationId)
  ])
}

export const ListingRow = connect(mapStateToProps)(
  withSaga(listingRowSaga)(
    class _ListingRow extends PureComponent {
      render () {
        const {
          owner,
          unstakedDeposit
        } = this.props.listing || {}

        return (
          <div className='list--item'>
            <span className="list--item__id">
              <EthAddress address={owner} />
            </span>

            <span className="list--item__date">
              <TILW wei={unstakedDeposit} />
            </span>

            <span className='list--item__status'>
              <strong>Hint:</strong> {this.props.hint}
              <br /><strong>Secret:</strong> {this.props.secret}
            </span>

            <span className="list--item__view">
            </span>
          </div>
        )
      }
    }
  )
)

ListingRow.propTypes = {
  listingHash: PropTypes.string.isRequired,
  listing: PropTypes.object
}

ListingRow.defaultProps = {
  listing: {}
}
