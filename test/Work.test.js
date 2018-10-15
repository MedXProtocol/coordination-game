/* eslint-env mocha */
/* global assert contract artifacts */
const Work = artifacts.require('Work.sol');
const WorkToken = artifacts.require('WorkToken.sol');
const BN = require('bn.js')
const debug = require('debug')('Work.test.js')

contract('Work', (accounts) => {
  let [staker, staker2] = accounts

  let token
  let work
  let initialStakerBalance

  const requiredStake = web3.toWei('100', 'ether')

  before(async () => {
    token = await WorkToken.deployed()

    await token.mint(staker, web3.toWei('1000', 'ether'))
    await token.mint(staker2, web3.toWei('1000', 'ether'))

    work = await Work.new(token.address, requiredStake)
    await token.approve(work.address, requiredStake, { from: staker })
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
      assert.equal(await work.addressStaked(staker), true)
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
      assert.equal(await work.addressStaked(staker), false)
      assert.equal(await token.balanceOf(work.address), '0')
      assert.equal((await token.balanceOf(staker)).toString(), initialStakerBalance.toString())
    })

    context('when multiple stakers', () => {
      it('should cleanly shorten when last element', async () => {
        await token.approve(work.address, requiredStake, { from: staker })
        await work.depositStake({ from: staker })
        debug(`work.depositStake() from ${staker}`)
        await work.depositStake({ from: staker2 })
        debug(`work.depositStake() from ${staker2}`)
        await work.withdrawStake({ from: staker })
        debug(`work.withdrawStake() from ${staker}`)
        assert.equal((await token.balanceOf(staker)).toString(), initialStakerBalance.toString())
        assert.equal(await work.addressStaked(staker), false)

        await token.approve(work.address, requiredStake, { from: staker })
        await work.depositStake({ from: staker })
        debug(`work.depositStake() from ${staker}`)
        assert.equal(
          (await token.balanceOf(work.address)).toString(),
          new BN(requiredStake).mul(new BN(2)).toString()
        )
        assert.equal(await work.addressStaked(staker), true)
      })
    })
  })
});
