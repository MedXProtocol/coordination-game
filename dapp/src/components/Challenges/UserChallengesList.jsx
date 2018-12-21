import React from 'react'
import { all } from 'redux-saga/effects'
import {
  withSaga,
  cacheCall,
  contractByName,
  cacheCallValue
} from 'saga-genesis'
import { connect } from 'react-redux'
import { range, get } from 'lodash'
import { isBlank } from '~/utils/isBlank'
import { ChallengesList } from '~/components/Challenges/ChallengesList'

const PAGE_SIZE = 5

function mapStateToProps(state, { currentPage, currentPageParamName }) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const PowerChallenge = contractByName(state, 'PowerChallenge')
  const challengeCount = cacheCallValue(state, PowerChallenge, 'userChallengesCount', address)
  const totalPages = Math.ceil(challengeCount / PAGE_SIZE)
  const startIndex = (parseInt(currentPage, 10) - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const ids = range(startIndex, endIndex).reduce((accumulator, index) => {
    const challengeId = cacheCallValue(state, PowerChallenge, 'userChallengeAt', address, index)
    if (!isBlank(challengeId)) {
      accumulator.push(challengeId)
    }
    return accumulator
  }, [])

  return {
    PowerChallenge,
    address,
    challengeCount,
    startIndex,
    endIndex,
    totalPages,
    ids
  }
}

function* challengesSaga({ address, PowerChallenge, startIndex, endIndex }) {
  if (!PowerChallenge) { return }
  yield cacheCall(PowerChallenge, 'userChallengesCount', address)
  yield all(
    range(startIndex, endIndex).map(function* (index) {
      yield cacheCall(PowerChallenge, 'userChallengeAt', address, index)
    })
  )
}

export const UserChallengesList = connect(mapStateToProps)(withSaga(challengesSaga)(
  function ({
    currentPage,
    currentPageParamName,
    totalPages,
    challengeCount,
    ids
  }) {
    return (
      <ChallengesList
        ids={ids}
        challengeCount={challengeCount}
        totalPages={totalPages}
        currentPage={currentPage}
        currentPageParamName={currentPageParamName}
        />
    )
  }
))
