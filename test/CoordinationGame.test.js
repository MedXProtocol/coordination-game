const CoordinationGame = artifacts.require('CoordinationGame.sol')
const Parameterizer = artifacts.require('Parameterizer.sol')
const TILRegistry = artifacts.require('TILRegistry.sol')
const TILRegistryFactory = artifacts.require('TILRegistryFactory.sol')
const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')

const abi = require('ethereumjs-abi')
const BN = require('bn.js')
const debug = require('debug')('CoordinationGame.test.js')
const tdr = require('truffle-deploy-registry')
const createTILRegistry = require('../migrations/support/createTILRegistry')

contract('CoordinationGame', (accounts) => {
  let coordinationGame,
    workToken,
    work,
    parameterizer,
    tilRegistry

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
    const parameterizerAddress = (await tdr.findLastByContractName(
      web3.version.network,
      'Parameterizer'
    )).address
    parameterizer = await Parameterizer.at(parameterizerAddress)


    assert.equal((await parameterizer.token()), workToken.address, 'parameterizer token matches work token')

    debug(`Minting Stake to Verifier ${stake.toString()}...`)
    await workToken.mint(verifier, stake)

    debug(`Approving stake ${stake.toString()} to ${work.address}...`)
    await workToken.approve(work.address, stake, { from: verifier })
    await work.depositStake({ from: verifier })
  })

  beforeEach(async () => {
    assert.equal((await parameterizer.token()), workToken.address, 'parameterizer token matches work token')

    tilRegistryFactoryInstance = await TILRegistryFactory.deployed()
    const addresses = await createTILRegistry(
      tilRegistryFactoryInstance,
      parameterizer.address,
      work.address,
      'TILRegistry'
    )

    const tilRegistryInstance = TILRegistry.at(addresses.tilRegistryAddress)
    assert.equal((await tilRegistryInstance.token()), workToken.address, 'token addresses no match')

    const coordinationGameAddress = await tilRegistryInstance.coordinationGame()
    coordinationGame = await CoordinationGame.at(coordinationGameAddress)

    const deposit = await parameterizer.get('minDeposit')
    debug(`Minting Deposit to Applicant ${deposit.toString()}...`)
    await workToken.mint(applicant, deposit)

    debug(`Approving CoordinationGame to spend ${deposit.toString()} for applicant...`)
    await workToken.approve(coordinationGameAddress, deposit, { from: applicant })

  })

  describe('start()', () => {
    it('should allow a user to start', async () => {
      await coordinationGame.start(
        secretRandomHash,
        randomHash,
        hint,
        {
          from: applicant
        }
      )

      const index = await coordinationGame.applicationIndices(applicant)
      const storedSecretRandomHash = await coordinationGame.secretAndRandomHashes(index)
      const storedRandomHash = await coordinationGame.randomHashes(index)
      const storedHint = await coordinationGame.hints(index)
      const selectedVerifier = await coordinationGame.verifiers(index)

      assert.equal(storedRandomHash, randomHash, 'random hash matches')
      assert.equal(storedSecretRandomHash, secretRandomHash, 'secret and random hash matches')
      assert.equal(storedHint, hint, 'hint matches')
      assert.equal(selectedVerifier, verifier, 'verifier matches')
    })
  })

  describe('verify()', () => {
    it('should allow the verifier to submit a secret', async () => {
      await coordinationGame.start(
        secretRandomHash,
        randomHash,
        hint,
        {
          from: applicant
        }
      )
      debug('verify() applied')
      const index = await coordinationGame.applicationIndices(applicant)
      debug('verify() applicationIndices')
      debug(`verify() verify(${index}, ${secret})...`)
      await coordinationGame.verify(index, secret, { from: verifier })
      debug('verify() verify')
      const storedVerifierSecret = await coordinationGame.verifierSecrets(index)
      assert.equal(secret, storedVerifierSecret)
    })
  })

  describe('reveal()', () => {
    it('should allow the applicant to reveal their secret', async () => {
      await coordinationGame.start(
        secretRandomHash,
        randomHash,
        hint,
        {
          from: applicant
        }
      )
      debug(`reveal() applicationIndices(${applicant})...`)
      const index = await coordinationGame.applicationIndices(applicant)
      debug(`reveal() verify(${index}, ${secret})...`)
      await coordinationGame.verify(index, secret, { from: verifier })
      debug(`reveal() reveal(${secret}, ${random})...`)
      await coordinationGame.reveal(secret, random.toString(), { from : applicant })
      const storedSecret = await coordinationGame.applicantSecrets(index)
      assert.equal(storedSecret, secret)
    })
  })
})
