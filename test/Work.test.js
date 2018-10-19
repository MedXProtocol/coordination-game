/* eslint-env mocha */
/* global assert contract artifacts */
const Work = artifacts.require('Work.sol');
const WorkToken = artifacts.require('WorkToken.sol');
const BN = require('bn.js')
const debug = require('debug')('Work.test.js')
const expectThrow = require('./helpers/expectThrow')

contract('Work', (accounts) => {
  let [staker, staker2, jobManager] = accounts

  let token
  let work
  let initialStakerBalance
  const jobStake = web3.toWei('10', 'ether')
  const requiredStake = web3.toWei('20', 'ether')
  const jobManagerBalance = web3.toWei('1000', 'ether')

  beforeEach(async () => {
    token = await WorkToken.deployed()
    work = await Work.new(token.address, requiredStake, jobStake)
    await work.setJobManager(jobManager)

    await token.mint(jobManager, jobManagerBalance)
    await token.approve(work.address, jobManagerBalance, { from: jobManager })

    await token.mint(staker, requiredStake)
    await token.approve(work.address, requiredStake, { from: staker })

    await token.mint(staker2, requiredStake)
    await token.approve(work.address, requiredStake, { from: staker2 })

    debug(`token.approve(${work.address}, ${requiredStake.toString()}) from ${staker}`)
    debug(`balance of ${staker}: ${await token.balanceOf(staker)}`)
    debug(`allowance from:  ${staker} ${work.address}: ${await token.allowance(staker, work.address)}`)
    initialStakerBalance = await token.balanceOf(staker)
  })

  async function balanceOf(address) {
    return new BN( (await work.balances(address)).toString() )
  }

  describe('constructor()', () => {
    it('should be constructed properly', async () => {
      assert.equal((await work.requiredStake()).toString(), requiredStake)
      assert.equal((await work.token()), token.address)
      assert.equal((await work.jobStake()), jobStake)
    });
  });

  describe('depositStake()', () => {
    it('should transfer the stake and add the sender as a staker', async () => {
      await work.depositStake({ from: staker })
      debug(`depositStake(): work.depositStake()`)
      assert.equal(await token.balanceOf(work.address), requiredStake)
      debug(`depositStake(): token.balanceOf(${work.address})`)
      assert.equal(await work.isStaker(staker), true)
    })
  })

  describe('selectWorker()', () => {
    it('should select a worker based on modulo input', async () => {
      await work.depositStake({ from: staker })

      assert.equal(await work.selectWorker(42), staker)
    })
  })

  describe('withdrawStake()', () => {
    it('should allow a staked user to withdraw their tokens', async () => {
      await work.depositStake({ from: staker })
      await work.withdrawStake({ from: staker })
      assert.equal(await work.isStaker(staker), false)
      assert.equal(await token.balanceOf(work.address), '0')
      assert.equal((await token.balanceOf(staker)).toString(), initialStakerBalance.toString())
    })

    context('when multiple stakers', () => {
      it('should cleanly shorten when last element', async () => {
        await work.depositStake({ from: staker })
        await work.depositStake({ from: staker2 })
        await work.withdrawStake({ from: staker })
        assert.equal((await token.balanceOf(staker)).toString(), initialStakerBalance.toString())
        assert.equal(await work.isStaker(staker), false)

        await token.approve(work.address, requiredStake, { from: staker })
        await work.depositStake({ from: staker })
        debug(`work.depositStake() from ${staker}`)
        assert.equal(
          (await token.balanceOf(work.address)).toString(),
          new BN(requiredStake).mul(new BN(2)).toString()
        )
        assert.equal(await work.isStaker(staker), true)
      })
    })
  })

  describe('withdrawJobStake()', () => {
    context('when a staker exists', () => {
      beforeEach(async () => {
        await work.depositStake({ from: staker })
      })

      it('should do nothing if called by anyone', async () => {
        await expectThrow(async () => {
          await work.withdrawJobStake(staker)
        })
      })

      it('should withdraw the job stake when called by the job manager', async () => {
        const startingBalance = await balanceOf(staker)
        await work.withdrawJobStake(staker, { from: jobManager })
        const finishingBalance = await balanceOf(staker)
        debug(`Balances: ${startingBalance.toString()}, ${finishingBalance.toString()}`)
        assert.equal(startingBalance.sub(finishingBalance).toString(), jobStake)
      })

      context('when the stakers balance hits zero', () => {
        beforeEach(async () => {
          await work.withdrawJobStake(staker, { from: jobManager })
        })

        it('should suspend the staker', async () => {
          await work.withdrawJobStake(staker, { from: jobManager })
          assert.equal(await work.isSuspended(staker), true, 'staker is suspended')
        })
      })
    })
  })

  describe('depositJobStake()', () => {
    context('when a staker exists', () => {
      beforeEach(async () => {
        await work.depositStake({ from: staker })
      })

      it('should add tokens to the stakers balance', async () => {
        const startingBalance = await balanceOf(staker)
        await work.depositJobStake(staker, { from: jobManager })
        const finishingBalance = await balanceOf(staker)
        assert.equal(finishingBalance.sub(startingBalance).toString(), jobStake)
      })

      context('and the staker is suspended', () => {
        beforeEach(async () => {
          await work.withdrawJobStake(staker, { from: jobManager })
          await work.withdrawJobStake(staker, { from: jobManager })
          assert.equal(await work.isSuspended(staker), true, 'staker is suspended')
        })

        it('should make the staker active again', async () => {
          await work.depositJobStake(staker, { from: jobManager })
          assert.equal(await work.isSuspended(staker), false, 'staker is not suspended')
          assert.equal(await work.isStaker(staker), true, 'staker is active')
        })
      })
    })
  })
});
