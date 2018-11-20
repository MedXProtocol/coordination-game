const PowerChallenge = artifacts.require('PowerChallenge.sol')
const WorkToken = artifacts.require('WorkToken.sol')

const BN = require('bn.js')
const numToBytes32 = require('./helpers/numToBytes32')
const debug = require('debug')('PowerChallenge.test.js')
const expectThrow = require('./helpers/expectThrow')
const increaseTime = require('./helpers/increaseTime')
const mineBlock = require('./helpers/mineBlock')
const mapToChallenge = require('./helpers/mapToChallenge')

contract('PowerChallenge', (accounts) => {
  const [owner, admin, challenger, approver] = accounts

  const firstChallengeAmount = new BN(web3.toWei('30', 'ether'))
  const timeout = 30 //seconds

  before(async () => {
    token = await WorkToken.new()
    await token.init(owner)
    powerChallenge = await PowerChallenge.new()
    await powerChallenge.init(owner, token.address, timeout)
    await token.mint(owner, web3.toWei('1000', 'ether'))
    await token.mint(challenger, web3.toWei('1000', 'ether'))
    await token.mint(approver, web3.toWei('1000', 'ether'))
  })

  let challengeCount = 0
  let challengeId
  const firstApprovalAmount = new BN(firstChallengeAmount).mul(new BN(2))
  const secondChallengeAmount = firstChallengeAmount.add(firstApprovalAmount).mul(new BN(2))

  beforeEach(async () => {
    challengeId = numToBytes32(challengeCount += 1)
    await powerChallenge.setTimeout(timeout)
  })

  async function getChallenge() {
    return mapToChallenge(await powerChallenge.challenges(challengeId))
  }

  async function startChallenge() {
    await token.approve(powerChallenge.address, firstChallengeAmount.toString(), { from: challenger })
    return await powerChallenge.startChallenge(challengeId, firstChallengeAmount.toString(), { from: challenger })
  }

  async function approve(amount) {
    await token.approve(powerChallenge.address, amount.toString(), { from: approver })
    return await powerChallenge.approve(challengeId, { from: approver })
  }

  async function challenge(amount) {
    await token.approve(powerChallenge.address, amount.toString(), { from: challenger })
    return await powerChallenge.challenge(challengeId, { from: challenger })
  }

  async function close() {
    return await powerChallenge.close(challengeId)
  }

  async function withdraw(options) {
    return await powerChallenge.withdraw(challengeId, options || {})
  }

  describe('startChallenge()', () => {
    it('should create a new challenge', async () => {
      debug('startChallenge()')
      const tx = await startChallenge()
      debug(tx)
      const challenge = await getChallenge()
      assert.equal(challenge.state, 1, 'state is challenged')
      assert.equal(challenge.round, 0, 'initial round')
      assert.equal(challenge.id, challengeId, 'id matches')
      assert.equal(tx.logs[0].event, 'ChallengeStarted', 'event was emitted')
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
        const tx = await approve(firstApprovalAmount)
        debug(tx)
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
      const tx = await challenge(secondChallengeAmount)
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

  describe('timeout()', () => {
    beforeEach(async () => {
      await startChallenge()
    })

    it('should fail', async () => {
      await expectThrow(async () => {
        await close()
      })
    })

    context('when timed out', () => {
      beforeEach(async () => {
        await powerChallenge.setTimeout(0)
      })

      it('should finish the challenge', async () => {
        const tx = await close()
        assert.equal(tx.logs[0].event, 'TimedOut', 'TimedOut event was emitted')
        const storage = await getChallenge()
        assert.equal(storage.state, 4, 'challenge was successful')
      })
    })
  })

  describe('withdraw()', () => {
    beforeEach(async () => {
      await startChallenge()
      await approve(firstApprovalAmount)
      await challenge(secondChallengeAmount)
    })

    context('when challenge incomplete', () => {
      it('should fail', async () => {
        await expectThrow(withdraw)
      })
    })

    context('when completed', () => {
      beforeEach(async () => {
        await powerChallenge.setTimeout(0)
        await close()
      })

      it('should withdraw the funds', async () => {
        const challengerStartingBalance = await token.balanceOf(challenger)
        const approverStartingBalance = await token.balanceOf(approver)

        const tx1 = await withdraw({ from: challenger })
        const tx2 = await withdraw({ from: approver })

        const challengerFinishingBalance = await token.balanceOf(challenger)
        const approverFinishingBalance = await token.balanceOf(approver)

        assert.equal(tx1.logs[0].event, 'Withdrawal', 'challenger withdrawal event was emitted')
        assert.equal(tx2.logs[0].event, 'Withdrawal', 'approver withdrawal event was emitted')

        assert.equal(approverFinishingBalance.sub(approverStartingBalance).toString(), 0, 'approver made no money')
        assert.equal(
          challengerFinishingBalance.sub(challengerStartingBalance).toString(),
          firstChallengeAmount.add(firstApprovalAmount).add(secondChallengeAmount),
          'challenger made alllll the tokens'
        )
      })
    })
  })
})
