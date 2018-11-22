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
import { AppId } from '~/components/AppId'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { formatRoute } from 'react-router-named-routes'
import * as routes from '~/../config/routes'
import { TEX } from '~/components/TEX'
import { mapToGame } from '~/services/mapToGame'
import { Listing } from '~/models/Listing'
import { Challenge } from '~/models/Challenge'
import { ApplicationListPresenter } from '~/components/Applications/ApplicationListPresenter'
import { HintStatus } from '~/components/HintStatus'
import { bytes32ToTicker } from '~/utils/bytes32ToTicker'

function mapStateToProps(state, { listingHash }) {
  const address = state.sagaGenesis.accounts[0]
  const TILRegistry = contractByName(state, 'TILRegistry')
  const PowerChallenge = contractByName(state, 'PowerChallenge')
  const CoordinationGame = contractByName(state, 'CoordinationGame')
  const game = mapToGame(cacheCallValue(state, CoordinationGame, 'games', listingHash))
  const listing = new Listing(cacheCallValue(state, TILRegistry, 'listings', listingHash))
  const challenge = new Challenge(cacheCallValue(state, PowerChallenge, 'challenges', listingHash))

  return {
    TILRegistry,
    CoordinationGame,
    PowerChallenge,
    listing,
    address,
    challenge,
    game
  }
}

function* listingRowSaga({ TILRegistry, CoordinationGame, PowerChallenge, listingHash }) {
  if (!TILRegistry || !CoordinationGame || !PowerChallenge || !listingHash) { return }
  yield all([
    cacheCall(TILRegistry, 'listings', listingHash),
    cacheCall(CoordinationGame, 'games', listingHash),
    cacheCall(PowerChallenge, 'challenges', listingHash)
  ])
}

export const ListingRow = connect(mapStateToProps)(
  withSaga(listingRowSaga)(
    class _ListingRow extends PureComponent {
      render () {
        const {
          listingHash,
          listing,
          game
        } = this.props

        const {
          hint
        } = game || {}

        return (
          <ApplicationListPresenter
            linkTo={formatRoute(routes.LISTING, { listingHash: bytes32ToTicker(listingHash) })}
            id={(
              <React.Fragment>
                <FontAwesomeIcon icon={faChevronUp} className="list--icon" />
                <AppId applicationId={listingHash} />
              </React.Fragment>
            )}
            date={<TEX wei={listing.deposit} />}
            status={<HintStatus applicationId={listingHash} hint={hint} />}
            view={''}
            needsAttention={false}
            ofInterest={false}
          />
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
