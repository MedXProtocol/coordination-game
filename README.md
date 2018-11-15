# MedX Protocol Coordination Game

$ npm i && truffle install

These smart contracts implement the MedX Protocol coordination game.  This game allows applicants to be added to a Registry by providing a hint and committing a secret.

# Local Setup

This project uses ZeppelinOS.  It's important to remember that the accounts that create the contracts are not able to interact with them.  The account that creates the contracts is called the **admin**.

It's best to use the *second* account in the Coordination Game owner mnemonic, because truffle likes to use the first account by default.

First start a local ZeppelinOS session using the admin account:

```
$ zos session --from $ADMIN_ACCOUNT --expires 10000 --network local
```

Now push instances of the contracts to the network specified in the session

```
$ zos push
```

Now you'll want to make sure all of your migrations are up-to-date

```
$ truffle migrate
```

Next, run the tests to make sure everything works

```
npm test
```

Once the contracts are compiled and migrated, run bootstrap to mint tokens and fill the faucet:

```
$ npm run bootstrap
```

To close the session:

```
$ zos session --close
```

## Usage

1. The Applicant creates a secret, a hint, and generates a random number.  The hash of the secret + random number is stored on-chain.  The hash of the random number is also stored on-chain. The hint is stored on-chain. They pay an Application Fee (Reward) in DAI, and a Deposit (in Tokens?).
2. The selected Verifier uses the hint to search for the secret
3. The Verifier commits their answer to the blockchain within the timeframe.  The Applicant reveals their secret at this time.
4. If the Verifier’s secret matches the applicant’s secret
   1. The Applicant is admitted to the registry
   2. The Verifier receives their reward
   3. (The Applicant is refunded a portion of their deposit?)
5. Otherwise the Verifier rejects the Applicant
   1. The application would then go to vote.  All of the verifiers would then vote on whether the Applicant is legitimate and that the hint was enough to establish their identity.
   2. If the vote approves the application
      1. The Voters split the entire Applicant’s deposit and the Applicant is accepted.  The Verifier’s deposit is sent to a reserve pool.  The voters in the minority lose half of their tokens, which are sent to the majority.
   3. Otherwise the voters reject the application
      1. The Voters split the entire Applicant’s deposit, the Verifier gets the Reward, and the Applicant is rejected. The voters in the minority lose half of their tokens, which are sent to the majority.

## TODO:

DISCUSS: Technically any user (verifier, admin, etc) could choose a random verifier for an applicant if they missed that step.

*Timeouts*

- If the Applicant doesn't kick off the second transaction for the random number based on the next block hash to choose a Verifier within timeframe (applicant loses deposit and application is void?)


email notifications
- If the Verifier doesn't commit their answer (secret) within the timeframe (then they get punished?) and a new Verifier is chosen

* verifier should not be allowed to respond after expiry date (DONE)
* applicant should be allowed to choose a new random verifier (DONE)
* original verifier gets punished?



email notifications
- If the Applicant doesn't reveal within the timeframe, (their deposit goes to the Verifier?) and their application is rejected

* applicant should not be allowed to respond after expiry date (DONE)
* verifier should be allowed to force reject the application & challenge (DONE)
   no challenge
* verifier gets their deposit back (and a reward?)
* applicant gets punished
  (part of applicant deposit to stake into TIL, part to verifier. Lose the verifier portion, but receive permanent staking back)

  remove challenge part

*Payouts*

- Need to pay the Verifier when the game is won or the vote rejects

- The Applicant needs to pay the reward in DAI (Application Fee) to the CoordinationGame contract as well as the Deposit (in Tokens?) for the application

- Reward payment from Applicant to Verifier (DAI payout) (deferred until production)

*Whistleblower Logic*

fill in

*Parameterizer Variables*

- Need to determine all of the parameterizer variables
  TODO: Whistleblower fee, verifier deposit amount, application deposit amount
  DONE: commit period, reveal period

*Building a Dapp*

- Make a dapp front-end! (will be an example dapp for SG)
  Price feed to purchase Tokens with Ether using current SAI price feed


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
