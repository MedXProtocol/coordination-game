const TILRegistry = artifacts.require('TILRegistry.sol')
const TILRoles = artifacts.require('TILRoles.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const Work = artifacts.require('Work.sol')

const abi = require('ethereumjs-abi')
const BN = require('bn.js')
const debug = require('debug')('TILRegistry.test.js')
const expectThrow = require('./helpers/expectThrow')
const increaseTime = require('./helpers/increaseTime')
const mineBlock = require('./helpers/mineBlock')
const leftPadHexString = require('./helpers/leftPadHexString')

contract('TILRegistry', (accounts) => {
  const [owner, user1, user2] = accounts

  const listingStake = web3.toWei('100', 'ether')
  const listingHash = '0x1000000000000000000000000000000000000000000000000000000000000000'

  let registry,
      workToken,
      work,
      roles

  before(async () => {
    work = await Work.deployed()
    workToken = await WorkToken.deployed()
    roles = await TILRoles.new()
    await roles.init(owner)
    await roles.setRole(owner, 1, true) // owner is the job manager
  })

  beforeEach(async () => {
    registry = await TILRegistry.new()
    await registry.initialize(workToken.address, roles.address, work.address)
    await workToken.mint(owner, listingStake)
    await workToken.approve(registry.address, listingStake)
  })

  describe('newListing()', () => {
    it('should only be called by the job manager', async () => {
      expectThrow(async () => {
        await registry.newListing(user1, listingHash, listingStake, { from: user2 })
      })
    })

    context('on success', () => {
      beforeEach(async () => {
        await registry.newListing(user1, listingHash, listingStake)
      })

      it('should add an applicant', async () => {
        assert.equal(await registry.listingsLength(), 1)
        assert.equal(await registry.listingAt(0), listingHash)
        assert.equal((await registry.listings(listingHash))[2].toNumber(), 0) // LISTED
      })
    })
  })

  describe('newListingChallenge()', () => {
    it('should only be called by the job manager', async () => {
      expectThrow(async () => {
        await registry.newListingChallenge(user1, listingHash, listingStake, { from: user2 })
      })
    })

    context('on success', () => {
      beforeEach(async () => {
        await registry.newListingChallenge(user1, listingHash, listingStake)
      })

      it('should add an applicant', async () => {
        const newListing = await registry.listings(listingHash)

        debug(`newListingChallenge(): ${newListing}`)

        assert.equal(await registry.listingsLength(), 1)
        assert.equal(await registry.listingAt(0), listingHash) // exists
        assert.equal(newListing[2].toNumber(), 1) // CHALLENGED
      })
    })
  })

  describe('withdrawListing()', () => {
    beforeEach(async () => {
      await registry.newListing(user1, listingHash, listingStake)
    })

    it('should allow an applicant to withdraw their listing', async () => {
      const user1StartingBalance = await workToken.balanceOf(user1)

      const tx = await registry.withdrawListing(listingHash, { from: user1 })

      debug(`withdrawListing() tx.logs: `, tx.logs)

      const ListingWithdrawn = tx.logs[0]
      assert.equal(ListingWithdrawn.event, 'ListingWithdrawn')
      expect(ListingWithdrawn.args).to.deep.equal({
        owner: user1,
        listingHash: listingHash
      })

      const user1EndingBalance = await workToken.balanceOf(user1)
      assert.equal(user1EndingBalance.toNumber(), user1StartingBalance.plus(listingStake).toNumber(), 'tokens were refunded')

      const listing = await registry.listings(listingHash)

      assert.equal(await registry.listingsLength(), 0, 'there are no listings')
      assert.equal(listing[0].toString(), '0x0000000000000000000000000000000000000000', 'there is no owner')
      assert.equal(listing[1].toString(), '0', 'there is no deposit')
    })
  })
})
