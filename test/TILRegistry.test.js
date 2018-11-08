const TILRegistry = artifacts.require('TILRegistry.sol')
const TILRegistryFactory = artifacts.require('TILRegistryFactory.sol')
const TILRoles = artifacts.require('TILRoles.sol')
const WorkToken = artifacts.require('WorkToken.sol')

const abi = require('ethereumjs-abi')
const BN = require('bn.js')
const debug = require('debug')('CoordinationGame.test.js')
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
      roles

  before(async () => {
    workToken = await WorkToken.deployed()
    registryFactory = await TILRegistryFactory.deployed()
    roles = await TILRoles.new()
    await roles.setRole(owner, 1, true) // owner is the job manager
  })

  beforeEach(async () => {
    registry = await registryFactory.createTILRegistry(
      workToken.address,
      [
        // minimum deposit for listing to be whitelisted
        listingStake,

        // minimum deposit to propose a reparameterization
        web3.toWei('10000000000', 'ether'),

        // period over which applicants wait to be whitelisted
        0,

        // period over which reparmeterization proposals wait to be processed
        3600 * 24 * 3, // 3 days

        // length of commit period for voting
        3600 * 24 * 3, // 3 days

        // length of commit period for voting in parameterizer
        3600 * 24 * 3, // 3 days

        // length of reveal period for voting
        3600 * 24 * 3, // 3 days

        // length of reveal period for voting in parameterizer
        3600 * 24 * 3, // 3 days

        // percentage of losing party's deposit distributed to winning party
        100,

        // percentage of losing party's deposit distributed to winning party in parameterizer
        50,

        // type of majority out of 100 necessary for candidate success
        30,

        // type of majority out of 100 necessary for proposal success in parameterizer
        30//,

        // // length of time in seconds an applicant has to wait for the verifier to
        // // submit a secret before choosing a new verifier
        // 120
      ],
      "MedX Registry",
      roles.address
    )
  })

  describe('apply', () => {
    it('should only be called by the job manager', async () => {
      expectThrow(async () => {
        await registry.apply(user1, '0x1', listingStake, '0x', { from: user2 })
      })
    })

    it('should add an applicant', async () => {
      await registry.apply(user1, '0x1', listingStake, '0x')
    })
  })
})
