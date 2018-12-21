import React, {
  PureComponent
} from 'react'
import { ListingRow } from '~/components/Registry/ListingRow'
import { LoadingLines } from '~/components/Helpers/LoadingLines'
import { Pagination } from '~/components/Helpers/Pagination'
import { formatPageRouteQueryParams } from '~/services/formatPageRouteQueryParams'
import * as routes from '~/../config/routes'

export class ChallengesList extends PureComponent {
  render () {
    let noChallenges,
      loadingLines

    const {
      ids,
      challengeCount,
      totalPages,
      currentPage,
      currentPageParamName
    } = this.props

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
    }

    return (
      <div className='list--container'>
        {loadingLines}
        {noChallenges}

        <div className="list">
          {ids.map(id => (
            <ListingRow
              listingHash={id}
              key={`applications-list-application-row-${id}`}
            />
          ))}
        </div>

        <Pagination
          currentPage={parseInt(currentPage, 10)}
          totalPages={totalPages}
          linkTo={(number, location) => formatPageRouteQueryParams(
            routes.CHALLENGES,
            currentPageParamName,
            number,
            location
          )}
        />
      </div>
    )
  }
}
