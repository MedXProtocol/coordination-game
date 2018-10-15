const CoordinationGame = artifacts.require('CoordinationGame.sol')
const Registry = artifacts.require('Registry.sol')
const Parameterizer = artifacts.require('Parameterizer.sol')
const RegistryFactory = artifacts.require('RegistryFactory.sol')
const abi = require('ethereumjs-abi')
const Work = artifacts.require('Work.sol')
const BN = require('bn.js')
const WorkToken = artifacts.require('WorkToken.sol')
const debug = require('debug')('CoordinationGame.test.js')
const tdr = require('truffle-deploy-registry')

contract('CoordinationGame', (accounts) => {
  let coordinationGame, workToken, work, registry, parameterizer

  const applicant = accounts[0]
  const verifier = accounts[1]

  const secret = '0x85dd39c91a64167ba20732b228251e67caed1462d4bcf036af88dc6856d0fdcc'
  const random = new BN("4312341235")
  const hint = web3.toHex("Totally bogus hint")

  debug(`using secret ${secret} and random ${random}`)

  const secretRandomHash = '0x' + abi.soliditySHA3(
    ['bytes32', 'uint256'],
    [secret, random]
  ).toString('hex')
  const randomHash = '0x' + abi.soliditySHA3(
    ['uint256'],
    [random]
  ).toString('hex')

  before(async () => {
    work = await Work.deployed()
    workToken = await WorkToken.deployed()
    stake = await work.requiredStake()
    parameterizer = await Parameterizer.at((await tdr.findLastByContractName(web3.version.network, 'Parameterizer')).address)
    debug(`Minting ${stake.toString()}...`)
    await workToken.mint(verifier, stake)
    debug(`Approving ${stake.toString()} to ${work.address}...`)
    await workToken.approve(work.address, stake, { from: verifier })
    await work.depositStake({ from: verifier })
  })

  beforeEach(async () => {
    RegistryFactory.new()
    
    coordinationGame = await CoordinationGame.new()
    registry = await Registry.new()
    await coordinationGame.init(work.address, registry.address)
  })

  describe('apply()', () => {
    it('should allow a user to apply', async () => {
      await coordinationGame.apply(
        secretRandomHash,
        randomHash,
        hint,
        {
          from: applicant
        }
      )

      const index = await coordinationGame.applicationIndex(applicant)
      const storedSecretRandomHash = await coordinationGame.secretAndRandomHash(index)
      const storedRandomHash = await coordinationGame.randomHash(index)
      const storedHint = await coordinationGame.hint(index)
      const selectedVerifier = await coordinationGame.verifier(index)

      assert.equal(storedRandomHash, randomHash, 'random hash matches')
      assert.equal(storedSecretRandomHash, secretRandomHash, 'secret and random hash matches')
      assert.equal(storedHint, hint, 'hint matches')
      assert.equal(selectedVerifier, verifier, 'verifier matches')
    })
  })

  describe('verify()', () => {
    it('should allow the verifier to submit a secret', async () => {
      await coordinationGame.apply(
        secretRandomHash,
        randomHash,
        hint,
        {
          from: applicant
        }
      )
      debug('verify() applied')
      const index = await coordinationGame.applicationIndex(applicant)
      debug('verify() applicationIndex')
      debug(`verify() verify(${index}, ${secret})...`)
      await coordinationGame.verify(index, secret, { from: verifier })
      debug('verify() verify')
      const storedVerifierSecret = await coordinationGame.verifierSecret(index)
      assert.equal(secret, storedVerifierSecret)
    })
  })

  describe('reveal()', () => {
    it('should allow the applicant to reveal their secret', async () => {
      await coordinationGame.apply(
        secretRandomHash,
        randomHash,
        hint,
        {
          from: applicant
        }
      )
      debug(`reveal() applicationIndex(${applicant})...`)
      const index = await coordinationGame.applicationIndex(applicant)
      debug(`reveal() verify(${index}, ${secret})...`)
      await coordinationGame.verify(index, secret, { from: verifier })
      debug(`reveal() reveal(${secret}, ${random})...`)
      await coordinationGame.reveal(secret, random.toString(), { from : applicant })
      const storedSecret = await coordinationGame.applicantSecret(index)
      assert.equal(storedSecret, secret)
    })
  })
})
