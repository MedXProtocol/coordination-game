const TILRegistry = artifacts.require('TILRegistry.sol')
const TILRegistryFactory = artifacts.require('TILRegistryFactory.sol')
const TILRoles = artifacts.require('TILRoles.sol')
const WorkToken = artifacts.require('WorkToken.sol')

const abi = require('ethereumjs-abi')
const BN = require('bn.js')
const debug = require('debug')('TILRegistry.test.js')
const tdr = require('truffle-deploy-registry')
const createTILRegistry = require('../migrations/support/createTILRegistry')
const expectThrow = require('./helpers/expectThrow')
const increaseTime = require('./helpers/increaseTime')
const mineBlock = require('./helpers/mineBlock')
const leftPadHexString = require('./helpers/leftPadHexString')

contract('TILRegistry', (accounts) => {
  const [owner, user1, user2] = accounts

  const listingStake = web3.toWei('100', 'ether')

  let registry,
      registryFactory,
      workToken,
      parameterizerAddress,
      roles

  before(async () => {
    workToken = await WorkToken.deployed()
    registryFactory = await TILRegistryFactory.deployed()
    roles = await TILRoles.new()
    await roles.setRole(owner, 1, true) // owner is the job manager
    parameterizerAddress = (await tdr.findLastByContractName(
      web3.version.network,
      'Parameterizer'
    )).address
  })

  beforeEach(async () => {
    const addresses = await createTILRegistry(
      registryFactory,
      parameterizerAddress,
      'MedX Token',
      roles.address
    )
    registry = await TILRegistry.at(addresses.tilRegistryAddress)
    await workToken.mint(owner, listingStake)
    await workToken.approve(registry.address, listingStake)
  })

  describe('apply', () => {
    it('should only be called by the job manager', async () => {
      expectThrow(async () => {
        await registry.applyFor(user1, '0x1', listingStake, '0x', { from: user2 })
      })
    })

    context('on success', () => {
      const listingHash = '0x1000000000000000000000000000000000000000000000000000000000000000'

      beforeEach(async () => {
        await registry.applyFor(user1, listingHash, listingStake, '0x')
      })

      it('should add an applicant', async () => {
        assert.equal(await registry.listingsLength(), 1)
        assert.equal(await registry.listingAt(0), listingHash)
      })
    })
  })
})
