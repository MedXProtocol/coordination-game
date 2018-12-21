import React from 'react'
import { all } from 'redux-saga/effects'
import {
  withSaga,
  cacheCall,
  contractByName,
  cacheCallValue
} from 'saga-genesis'
import { connect } from 'react-redux'
import { range } from 'lodash'
import { isBlank } from '~/utils/isBlank'
import { ChallengesList } from '~/components/Challenges/ChallengesList'

const PAGE_SIZE = 5

function mapStateToProps(state, { currentPage, currentPageParamName }) {
  const PowerChallenge = contractByName(state, 'PowerChallenge')
  const challengeCount = cacheCallValue(state, PowerChallenge, 'challengeCount')
  const totalPages = Math.ceil(challengeCount / PAGE_SIZE)
  const startIndex = (parseInt(currentPage, 10) - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const ids = range(startIndex, endIndex).reduce((accumulator, index) => {
    const challengeId = cacheCallValue(state, PowerChallenge, 'challengeAt', index)
    if (!isBlank(challengeId)) {
      accumulator.push(challengeId)
    }
    return accumulator
  }, [])

  return {
    PowerChallenge,
    challengeCount,
    startIndex,
    endIndex,
    totalPages,
    ids
  }
}

function* challengesSaga({ PowerChallenge, startIndex, endIndex }) {
  if (!PowerChallenge) { return }
  yield cacheCall(PowerChallenge, 'challengeCount')
  yield all(
    range(startIndex, endIndex).map(function* (index) {
      yield cacheCall(PowerChallenge, 'challengeAt', index)
    })
  )
}

export const AllChallengesList = connect(mapStateToProps)(withSaga(challengesSaga)(
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
