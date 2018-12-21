import React from 'react'
import { PageTitle } from '~/components/Helpers/PageTitle'
import { ScrollToTop } from '~/components/Helpers/ScrollToTop'
import { AllChallengesList } from '~/components/Challenges/AllChallengesList'
import { UserChallengesList } from '~/components/Challenges/UserChallengesList'

export const ChallengesTable = function ({
  match
}) {

  const {
    currentPage,
    userPage
  } = match.params

  const currentPageValue = currentPage || 1
  const userPageValue = userPage || 1

  return (
    <React.Fragment>
      <ScrollToTop
        disabled={!!currentPage || !!userPage}
      />
      <PageTitle title='challenges' />

      <h1 className="is-size-1">
        Challenges
      </h1>

      <p>
        A challenge occurs when a submission in the Registry is refuted, or an applicant's submission is rejected. You can vote in favour of or against a challenge using TEX tokens.
      </p>

      <hr />

      <h6 className='list--title'>All Challenges</h6>

      <AllChallengesList currentPage={currentPageValue} currentPageParamName='currentPage' />

      <br />

      <h6 className='list--title'>Your Challenges</h6>

      <UserChallengesList currentPage={userPageValue} currentPageParamName='userPage' />

    </React.Fragment>
  )
}
