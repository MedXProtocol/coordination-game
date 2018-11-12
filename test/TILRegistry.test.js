const TILRegistry = artifacts.require('TILRegistry.sol')
const TILRoles = artifacts.require('TILRoles.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const Work = artifacts.require('Work.sol')

const abi = require('ethereumjs-abi')
const BN = require('bn.js')
const debug = require('debug')('TILRegistry.test.js')
const tdr = require('truffle-deploy-registry')
const expectThrow = require('./helpers/expectThrow')
const increaseTime = require('./helpers/increaseTime')
const mineBlock = require('./helpers/mineBlock')
const leftPadHexString = require('./helpers/leftPadHexString')

contract('TILRegistry', (accounts) => {
  const [owner, user1, user2] = accounts

  const listingStake = web3.toWei('100', 'ether')

  let registry,
      workToken,
      work,
      roles

  before(async () => {
    work = await Work.deployed()
    workToken = await WorkToken.deployed()
    roles = await TILRoles.new()
    await roles.setRole(owner, 1, true) // owner is the job manager
  })

  beforeEach(async () => {
    registry = await TILRegistry.new(workToken.address, roles.address, work.address)
    await workToken.mint(owner, listingStake)
    await workToken.approve(registry.address, listingStake)
  })

  describe('apply', () => {
    it('should only be called by the job manager', async () => {
      expectThrow(async () => {
        await registry.newListing(user1, '0x1', listingStake, { from: user2 })
      })
    })

    context('on success', () => {
      const listingHash = '0x1000000000000000000000000000000000000000000000000000000000000000'

      beforeEach(async () => {
        await registry.newListing(user1, listingHash, listingStake)
      })

      it('should add an applicant', async () => {
        assert.equal(await registry.listingsLength(), 1)
        assert.equal(await registry.listingAt(0), listingHash)
      })
    })
  })
})
