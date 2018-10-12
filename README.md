# MedX Protocol Coordination Game

These smart contracts implement the MedX Protocol coordination game.  This game allows applicants to be added to a Registry by providing a hint and committing a secret.

## Usage

1. The Applicant creates a secret, a hint, and generates a random number.  The hash of the secret + random number is stored on-chain.  The hash of the random number is also stored on-chain. The hint is stored on-chain.
2. The selected Verifier uses the hint to search for the secret
3. The Verifier commits their answer to the blockchain within the timeframe.  The Applicant reveals their secret at this time.
4. If the Verifier’s secret matches the applicant’s secret
   1. The applicant is admitted to the registry.
   2. The Verifier receives their reward.
   3. The applicant is refunded a portion of their deposit.
5. Otherwise the Verifier rejects the applicant
   1. The application would then go to vote.  All of the verifiers would then vote on whether the applicant is legitimate and that the hint was enough to establish their identity.
   2. If the application is legitimate
      1. The Voters split the entire Applicant’s deposit and the applicant is accepted.  The Verifier’s deposit is burned or sent to a reserve pool.  The voters in the minority lose half of their tokens, which are sent to the majority.
   3. Otherwise the voters reject the application
      1. The Voters split the entire Applicant’s deposit and the applicant is rejected. The split size is proportional to the majority vs minority.  The voters in the minority lose half of their tokens, which are sent to the majority.

## Exploits and Collusions

### Applicant

**Problem**: An Applicant can divulge their secret to the Verifier, potentially speeding up the approval process.

An applicant can be incentivized to give the Verifier a good hint so that they are charged less for the application because if it goes to vote, it costs them more.

An Applicant could potentially coerce a Verifier by giving them the secret along with a bribe that is greater than the Verifier’s deposit, assuring the Verifier that even if the Applicant is lying they will be covered financially.

The applicant needs to give the Verifier a good hint.  In the case of a bad hint the verifier could “pass” on the application.  The application would go directly to a vote, and the Verifier would not be punished or rewarded.  The vote would cost more than if the Verifier had simply approved.

### Verifier

If a Verifier submits the secret and random number they act as a whistleblower and the applicant will be rejected and they will receive an award larger than the approval.
User Experience
Involving the doctor in the game theory side of things requires a lot of education, and is a strange experience. We need to make sure they know that if they are asked for their information to instead lie.

Additionally, to incentivize them to do so we may have to partially refund them money.  Which is unfair to the system and should go towards the verifiers doing the work.

## Voter

Since the majority voters get 50% of the minority token voters tokens, there’s an interesting incentive to misdirect a small group of other voters:

The maximum amount of rewards are earned if the majority is 51% and minority is 49%. So it’s actually in a voters interest to deceive a fellow voter if they think they’ll still get a >51% majority.

The voters can't trust anyone.
