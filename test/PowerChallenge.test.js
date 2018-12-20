const PowerChallenge = artifacts.require('PowerChallenge.sol')
const WorkToken = artifacts.require('WorkToken.sol')

const BN = require('bn.js')
const numToBytes32 = require('./helpers/numToBytes32')
const debug = require('debug')('PowerChallenge.test.js')
const expectThrow = require('./helpers/expectThrow')
const increaseTime = require('./helpers/increaseTime')
const mineBlock = require('./helpers/mineBlock')
const mapToChallenge = require('./helpers/mapToChallenge')
const isApproxEqualBN = require('./helpers/isApproxEqualBN')

contract('PowerChallenge', (accounts) => {
  const [owner, admin, challenger, approver, challenger2] = accounts

  const firstChallengeAmount = new BN(web3.toWei('30', 'ether'))
  const timeout = 30 //seconds

  before(async () => {
    token = await WorkToken.new()
    await token.init(owner)
    powerChallenge = await PowerChallenge.new()
    await powerChallenge.init(owner, token.address, timeout)
    await token.mint(owner, web3.toWei('1000', 'ether'))
    await token.mint(challenger, web3.toWei('1000', 'ether'))
    await token.mint(challenger2, web3.toWei('1000', 'ether'))
    await token.mint(approver, web3.toWei('1000', 'ether'))
  })

  let challengeCount = 0
  let challengeId
  const firstApprovalAmount = new BN(firstChallengeAmount).mul(new BN(2))
  const secondChallengeAmount = firstChallengeAmount.add(firstApprovalAmount)

  beforeEach(async () => {
    challengeId = numToBytes32(challengeCount += 1)
    await powerChallenge.setTimeout(timeout)
  })

  async function getChallenge() {
    return mapToChallenge(await powerChallenge.challenges(challengeId))
  }

  async function startChallenge(user = challenger) {
    await token.approve(powerChallenge.address, firstChallengeAmount.toString(), { from: user })
    return await powerChallenge.startChallenge(challengeId, firstChallengeAmount.toString(), { from: user })
  }

  async function approve(amount) {
    await token.approve(powerChallenge.address, amount.toString(), { from: approver })
    return await powerChallenge.approve(challengeId, { from: approver })
  }

  async function challenge(amount, user = challenger) {
    await token.approve(powerChallenge.address, amount.toString(), { from: user })
    return await powerChallenge.challenge(challengeId, { from: user })
  }

  async function withdraw(options) {
    return await powerChallenge.withdraw(challengeId, options || {})
  }

  describe('startChallenge()', () => {
    it('should create a new challenge', async () => {
      debug('startChallenge()')
      const startingChallengeCount = await powerChallenge.userChallengesCount(challenger)
      const tx = await startChallenge()
      debug(tx)
      const challenge = await getChallenge()
      assert.equal(challenge.state, 1, 'state is challenged')
      assert.equal(challenge.round, 0, 'initial round')
      assert.equal(challenge.id, challengeId, 'id matches')
      assert.equal(tx.logs[0].event, 'ChallengeStarted', 'event was emitted')
      assert.equal((await powerChallenge.userChallengesCount(challenger)).toString(), startingChallengeCount.add(1).toString(), 'challenge count matches')
      assert.equal(await powerChallenge.userChallengeAt(challenger, 0), challengeId, 'challenge id is correct')
      assert.equal(
        (await powerChallenge.challengeBalance(challengeId, challenger)).toString(), firstChallengeAmount,
        'first challenge amount matches'
      )
    })

    context('when not approved for enough tokens', () => {
      it('should reject', async () => {
        await token.approve(powerChallenge.address, 0, { from: challenger })
        debug(`approved for ${(await token.allowance(challenger, powerChallenge.address)).toString()}`)
        await expectThrow(async () => {
          await powerChallenge.startChallenge(challengeId, firstChallengeAmount.toString(), { from: challenger })
        })
      })
    })

    it('should not allow a second challenge to be started over the first', async () => {
      await startChallenge()

      await expectThrow(async () => {
        await startChallenge()
      })
    })
  })

  describe('approve()', () => {
    it('should fail without a challenge', async () => {
      await expectThrow(async () => {
        await approve(firstApprovalAmount)
      })
    })

    context('with a challenge', () => {
      beforeEach(async () => {
        await startChallenge()
      })

      it('should approve of the listing', async () => {
        const startingApprovalCount = await powerChallenge.userChallengesCount(approver)
        const tx = await approve(firstApprovalAmount)
        debug(tx)
        assert.equal((await powerChallenge.userChallengesCount(approver)).toString(), startingApprovalCount.add(1).toString(), 'approval count is one')
        const challenge = await getChallenge()
        assert.equal(challenge.state, 2, 'state is approved')
        assert.equal(challenge.round, 1, 'second round')
        assert.equal(tx.logs[0].event, 'Approved', 'approved event was emitted')
        assert.equal(
          (await powerChallenge.approveBalance(challengeId, approver)).toString(), firstApprovalAmount,
          'first challenge amount matches'
        )
      })
    })
  })

  describe('challenge()', () => {
    beforeEach(async () => {
      await startChallenge()
      await approve(firstApprovalAmount)
    })

    it('should challenge the listing', async () => {
      const beforeChallengeCount = await powerChallenge.userChallengesCount(challenger)
      const tx = await challenge(secondChallengeAmount)
      assert.equal((await powerChallenge.userChallengesCount(challenger)).toString(), beforeChallengeCount.toString(), 'challenge count is still one')
      debug(tx)
      const storage = await getChallenge()
      debug(storage)
      assert.equal(storage.state, 1, 'state is challenged')
      assert.equal(storage.round, 2, 'third round')
      assert.equal(tx.logs[0].event, 'Challenged', 'challenged event was emitted')
      assert.equal(
        (await powerChallenge.challengeBalance(challengeId, challenger)).toString(), firstChallengeAmount.add(secondChallengeAmount),
        'total challenge amount matches'
      )
    })
  })

  describe('withdraw()', () => {
    beforeEach(async () => {
      await startChallenge()
    })

    context('when challenge has not timed out', () => {
      it('should fail', async () => {
        await expectThrow(async () => {
          await withdraw({ from: challenger })
        })
      })
    })

    context('when completed', () => {
      let challengerStartingBalance, tx1

      beforeEach(async () => {
        challengerStartingBalance = await token.balanceOf(challenger)
        await powerChallenge.setTimeout(0)
        tx1 = await withdraw({ from: challenger })
      })

      it('withdraw should send tokens to the challenger', async () => {
        const challengerFinishingBalance = await token.balanceOf(challenger)

        assert.equal(tx1.logs[0].event, 'Closed', 'challenger closed event was emitted')
        assert.equal(tx1.logs[1].event, 'Withdrew', 'challenger withdrawal event was emitted')

        assert.equal(
          challengerFinishingBalance.sub(challengerStartingBalance).toString(),
          firstChallengeAmount,
          'challenger made alllll the tokens'
        )
      })
    })

    context('when completed with multiple challengers', () => {
      const challengeTotal = firstChallengeAmount.add(secondChallengeAmount)
      const total = challengeTotal.add(firstApprovalAmount)
      const challenger2Share = total.mul(secondChallengeAmount).div(challengeTotal)
      const challengerShare = total.mul(firstChallengeAmount).div(challengeTotal)

      debug(`challenger2Share: ${challenger2Share.toString()}`)

      let challengerStartingBalance, challenger2StartingBalance, tx1

      beforeEach(async () => {
        await approve(firstApprovalAmount)
        await challenge(secondChallengeAmount, challenger2)
        challengerStartingBalance = await token.balanceOf(challenger)
        challenger2StartingBalance = await token.balanceOf(challenger2)
        await powerChallenge.setTimeout(0)
        tx1 = await withdraw({ from: challenger })
      })

      it('should support withdraw for each challenger', async () => {
        tx2 = await withdraw({ from: challenger2 })
        const challenger2FinishingBalance = await token.balanceOf(challenger2)
        challengerFinishingBalance = await token.balanceOf(challenger)

        const c = await getChallenge()

        assert.equal(
          challengerFinishingBalance.toString(),
          challengerStartingBalance.add(challengerShare).toString(),
          'First challenger has withdrawn their share'
        )

        assert.ok(
          isApproxEqualBN(
            challenger2FinishingBalance,
            challenger2StartingBalance.add(challenger2Share),
            1
          ),
          'Second challenger has withdrawn their share'
        )

        assert.equal(
          c.totalWithdrawn.toString(),
          c.challengeTotal.add(c.approveTotal).toString(),
          'total withdrawn is correct'
        )
      })

      it('should not allow a new challenge until all is withdrawn', async () => {
        await expectThrow(async () => {
          await startChallenge()
        })

        await withdraw({ from: challenger2 })

        const c = await getChallenge()

        await startChallenge()
      })
    })

    context('with approval', () => {
      let approverStartingBalance

      beforeEach(async () => {
        await approve(firstApprovalAmount)
        approverStartingBalance = await token.balanceOf(approver)
        await powerChallenge.setTimeout(0)
      })

      it('should provide tokens for the approver', async () => {
        const tx1 = await withdraw({ from: approver })
        const approverFinishingBalance = await token.balanceOf(approver)

        assert.equal(tx1.logs[0].event, 'Closed', 'approver closed event was emitted')
        assert.equal(tx1.logs[1].event, 'Withdrew', 'approver withdrawal event was emitted')

        assert.equal(
          approverFinishingBalance.toString(),
          approverStartingBalance.add(firstChallengeAmount).add(firstApprovalAmount).toString(),
          'approver withdrew all of the tokens'
        )
      })
    })
  })
})
