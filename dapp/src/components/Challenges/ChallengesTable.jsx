import React, {
  PureComponent
} from 'react'
import { all } from 'redux-saga/effects'
import {
  withSaga,
  cacheCall,
  contractByName,
  cacheCallValue
} from 'saga-genesis'
import { connect } from 'react-redux'
import { range } from 'lodash'
import { ListingRow } from '~/components/Registry/ListingRow'
import { LoadingLines } from '~/components/Helpers/LoadingLines'
import { PageTitle } from '~/components/Helpers/PageTitle'
import { Pagination } from '~/components/Helpers/Pagination'
import { ScrollToTop } from '~/components/Helpers/ScrollToTop'
import { AnimatedWrapper } from "~/components/Layout/AnimatedWrapper"
import { formatPageRouteQueryParams } from '~/services/formatPageRouteQueryParams'
import { isBlank } from '~/utils/isBlank'
import * as routes from '~/../config/routes'

const PAGE_SIZE = 5

function mapStateToProps(state, { match }) {
  const currentPage = match.params.currentPage || 1
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

export const ChallengesTable = AnimatedWrapper(
  connect(mapStateToProps)(withSaga(challengesSaga)(
    class _ChallengesTable extends PureComponent {
      renderChallengeRows(ids) {
        return ids.map((challengeId) => {
          return (
            <ListingRow
              listingHash={challengeId}
              key={`applications-list-application-row-${challengeId}`}
            />
          )
        })
      }

      render () {
        let noChallenges,
          loadingLines,
          challengeRows

        const { ids, challengeCount } = this.props
        const loading = challengeCount === undefined

        if (loading) {
          loadingLines = (
            <div className="blank-state">
              <div className="blank-state--inner has-text-grey">
                <LoadingLines visible={true} />
              </div>
            </div>
          )
        } else if (!ids.length) {
          noChallenges = (
            <div className="blank-state">
              <div className="blank-state--inner has-text-grey">
                <span className="is-size-6">There are currently no challenges to vote on.</span>
              </div>
            </div>
          )
        } else {
          challengeRows = (
            this.renderChallengeRows(ids)
          )
        }

        return (
          <React.Fragment>
            <ScrollToTop
              disabled={this.props.currentPage}
            />
            <PageTitle title='challenges' />

            <h1 className="is-size-1">
              Challenges
            </h1>

            <p>
              A challenge occurs when a submission in the Registry is refuted, or an applicant's submission is rejected. You can vote in favour of or against a challenge using TEX tokens.
            </p>

            <hr />

            <div className='list--container'>
              {loadingLines}
              {noChallenges}

              <div className="list">
                {challengeRows}
              </div>

              <Pagination
                currentPage={parseInt(this.props.currentPage, 10)}
                totalPages={this.props.totalPages}
                linkTo={(number, location) => formatPageRouteQueryParams(
                  routes.CHALLENGES,
                  'challengesCurrentPage',
                  number,
                  location
                )}
              />
            </div>
          </React.Fragment>
        )
      }
    }
  )
))
