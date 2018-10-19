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
  const requiredStake = web3.toWei('100', 'ether')

  before(async () => {
    token = await WorkToken.deployed()
    work = await Work.new(token.address, requiredStake, jobStake)
    await work.setJobManager(jobManager)

    await token.mint(staker, web3.toWei('1000', 'ether'))
    await token.approve(work.address, requiredStake, { from: staker })

    await token.mint(staker2, web3.toWei('1000', 'ether'))
    await token.approve(work.address, requiredStake, { from: staker2 })

    debug(`token.approve(${work.address}, ${requiredStake.toString()}) from ${staker}`)
    debug(`balance of ${staker}: ${await token.balanceOf(staker)}`)
    debug(`allowance from:  ${staker} ${work.address}: ${await token.allowance(staker, work.address)}`)
    initialStakerBalance = await token.balanceOf(staker)
  })

  describe('constructor()', () => {
    it('should be constructed properly', async () => {
      assert.equal((await work.requiredStake()).toString(), requiredStake)
      assert.equal((await work.token()), token.address)
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
      assert.equal(await work.selectWorker(42), staker)
    })
  })

  describe('withdrawStake()', () => {
    it('should allow a staked user to withdraw their tokens', async () => {
      await work.withdrawStake({ from: staker })
      assert.equal(await work.isStaker(staker), false)
      assert.equal(await token.balanceOf(work.address), '0')
      assert.equal((await token.balanceOf(staker)).toString(), initialStakerBalance.toString())
    })

    context('when multiple stakers', () => {
      it('should cleanly shorten when last element', async () => {
        await token.approve(work.address, requiredStake, { from: staker })
        debug(`balance1: ${(await token.balanceOf(work.address)).toString()}`)
        debug(`balance staker: ${(await work.balances(staker)).toString()}`)
        debug(`balance staker2: ${(await work.balances(staker2)).toString()}`)
        await work.depositStake({ from: staker })
        debug(`balance2: ${(await token.balanceOf(work.address)).toString()}`)
        debug(`balance staker: ${(await work.balances(staker)).toString()}`)
        debug(`balance staker2: ${(await work.balances(staker2)).toString()}`)
        await work.depositStake({ from: staker2 })
        debug(`balance3: ${(await token.balanceOf(work.address)).toString()}`)
        debug(`balance staker: ${(await work.balances(staker)).toString()}`)
        debug(`balance staker2: ${(await work.balances(staker2)).toString()}`)
        await work.withdrawStake({ from: staker })
        debug(`balance4: ${(await token.balanceOf(work.address)).toString()}`)
        debug(`balance staker: ${(await work.balances(staker)).toString()}`)
        debug(`balance staker2: ${(await work.balances(staker2)).toString()}`)
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
        const startingBalance = work.balances(staker)
        await work.withdrawJobStake(staker, { from: jobManager })
        const finishingBalance = work.balances(staker)
        expect(startingBalance.sub(finishingBalance)).toEqual(jobStake)
      })
    })
  })
});
