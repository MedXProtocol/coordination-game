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
const expectThrow = require('./helpers/expectThrow')
const increaseTime = require('./helpers/increaseTime')

contract('CoordinationGame', (accounts) => {
  let coordinationGame,
    workToken,
    work,
    tilParameterizer,
    tilRegistry,
    secondsInADay

  const applicant = accounts[0]
  const verifier = accounts[1]
  const verifier2 = accounts[2]

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
    const tilParameterizerAddress = (await tdr.findLastByContractName(
      web3.version.network,
      'TILParameterizer'
    )).address
    tilParameterizer = await TILParameterizer.at(tilParameterizerAddress)


    const verifierTimeout = await tilParameterizer.get('verifierTimeout')
    debug(`verifierTimeout ${verifierTimeout.toString()}...`)

    const minDeposit = await tilParameterizer.get('minDeposit')
    debug(`minDeposit ${minDeposit.toString()}...`)



    assert.equal((await tilParameterizer.token()), workToken.address, 'tilParameterizer token matches work token')

    debug(`Minting Stake to Verifier ${stake.toString()}...`)
    await workToken.mint(verifier, stake)

    debug(`Approving stake ${stake.toString()} to ${work.address} for Verifier...`)
    await workToken.approve(work.address, stake, { from: verifier })
    await work.depositStake({ from: verifier })


    debug(`Minting Stake to Verifier2 ${stake.toString()}...`)
    await workToken.mint(verifier2, stake)

    debug(`Approving stake ${stake.toString()} to ${work.address} for Verifier2...`)
    await workToken.approve(work.address, stake, { from: verifier2 })
    await work.depositStake({ from: verifier2 })
  })

  beforeEach(async () => {
    assert.equal((await tilParameterizer.token()), workToken.address, 'tilParameterizer token matches work token')

    tilRegistryFactoryInstance = await TILRegistryFactory.deployed()
    const addresses = await createTILRegistry(
      tilRegistryFactoryInstance,
      tilParameterizer.address,
      work.address,
      'TILRegistry'
    )

    tilRegistry = TILRegistry.at(addresses.tilRegistryAddress)
    assert.equal((await tilRegistry.token()), workToken.address, 'token addresses match')

    const coordinationGameAddress = await tilRegistry.coordinationGame()
    coordinationGame = await CoordinationGame.at(coordinationGameAddress)

    secondsInADay = (await coordinationGame.secondsInADay()).toNumber()

    // Approve the coordinationGame contract of spending tokens on behalf of the work
    await work.approve(coordinationGameAddress)

    const deposit = await tilParameterizer.get('minDeposit')
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

      const applicationId = await coordinationGame.getApplicantsLastApplicationID({ from: applicant })

      const storedSecretRandomHash = await coordinationGame.secretAndRandomHashes(applicationId)
      const storedRandomHash = await coordinationGame.randomHashes(applicationId)
      const storedHint = await coordinationGame.hints(applicationId)

      assert.equal(storedRandomHash, randomHash, 'random hash matches')
      assert.equal(storedSecretRandomHash, secretRandomHash, 'secret and random hash matches')
      assert.equal(storedHint, hint, 'hint matches')
    })
  })

  describe('applicantRandomlySelectVerifier()', () => {
    let applicationId

    beforeEach(async () => {
      await coordinationGame.start(
        secretRandomHash,
        randomHash,
        hint,
        {
          from: applicant
        }
      )
      applicationId = await coordinationGame.getApplicantsLastApplicationID({ from: applicant })

      await coordinationGame.applicantRandomlySelectVerifier(
        applicationId,
        {
          from: applicant
        }
      )
    })

    it('should allow applicant to randomly select a verifier', async () => {
      const selectedVerifier = await coordinationGame.verifiers(applicationId)
      assert([verifier, verifier2].includes(selectedVerifier), '1st verifier matches')
    })

    it('should not allow a new verifier unless enough time has passed', async () => {
      const firstVerifier = await coordinationGame.verifiers(applicationId)

      await expectThrow(async () => {
        await coordinationGame.applicantRandomlySelectVerifier(
          applicationId,
          {
            from: applicant
          }
        )
      })

      await increaseTime(secondsInADay * 3)

      await coordinationGame.applicantRandomlySelectVerifier(
        applicationId,
        {
          from: applicant
        }
      )

      const newVerifier = await coordinationGame.verifiers(applicationId)
      assert([verifier, verifier2].includes(newVerifier), 'new verifier matches')
      assert.notEqual(newVerifier, firstVerifier, 'new verifier is not first verifier')
    })
  })

  describe('verifierSubmitSecret()', () => {
    it('should allow the verifier to submit a secret', async () => {
      await coordinationGame.start(
        secretRandomHash,
        randomHash,
        hint,
        {
          from: applicant
        }
      )

      const applicationId = await coordinationGame.getApplicantsLastApplicationID({ from: applicant })

      await coordinationGame.applicantRandomlySelectVerifier(
        applicationId,
        {
          from: applicant
        }
      )

      const randomlySelectedVerifier = await coordinationGame.verifiers(applicationId)

      debug(`verifierSubmitSecret() verifierSubmitSecret(${applicationId}, ${secret})...`)
      await coordinationGame.verifierSubmitSecret(applicationId, secret, {
        from: randomlySelectedVerifier
      })

      debug('verifierSubmitSecret() verifierSubmitSecret')
      const storedVerifierSecret = await coordinationGame.verifierSecrets(applicationId)
      assert.equal(secret, storedVerifierSecret)
    })
  })

  describe('applicantRevealSecret()', () => {
    let applicationId,
      randomlySelectedVerifier

    beforeEach(async () => {
      await coordinationGame.start(
        secretRandomHash,
        randomHash,
        hint,
        {
          from: applicant
        }
      )
      debug(`applicantRevealSecret() won getApplicantsLastApplicationID(${applicant})...`)
      applicationId = await coordinationGame.getApplicantsLastApplicationID({ from: applicant })

      await coordinationGame.applicantRandomlySelectVerifier(
        applicationId,
        {
          from: applicant
        }
      )

      randomlySelectedVerifier = await coordinationGame.verifiers(applicationId)
    })

    describe('when secret does match and game is won', () => {
      it('should add applicant to registry (and pay out verifier)', async () => {
        debug(`applicantRevealSecret() won verifierSubmitSecret(${applicationId}, ${secret})...`)
        await coordinationGame.verifierSubmitSecret(applicationId, secret, {
          from: randomlySelectedVerifier
        })

        debug(`applicantRevealSecret() won applicantRevealSecret(${secret}, ${random})...`)
        await coordinationGame.applicantRevealSecret(
          applicationId,
          secret,
          random.toString(),
          { from: applicant }
        )

        debug(`applicantRevealSecret() won applicantSecrets(${applicationId})...`)
        const storedSecret = await coordinationGame.applicantSecrets(applicationId)
        assert.equal(storedSecret, secret)

        debug(`applicantRevealSecret() won getListingHash(${applicationId})...`)
        const listingHash = await coordinationGame.getListingHash(applicationId)

        debug(`applicantRevealSecret() won listings(${listingHash})...`)
        const listing = await tilRegistry.listings(listingHash)

        assert.equal(listing[4].toString(), '0', 'application is not challenged')
        assert.equal(listing[1], true, 'application is whitelisted')
      })
    })

    describe('when secret does not match and game is lost', () => {
      it('should make a challenge and go to vote', async () => {
        const differentSecret = '0x56'

        debug(`applicantRevealSecret() failed verifierSubmitSecret(${applicationId}, ${secret})...`)
        await coordinationGame.verifierSubmitSecret(applicationId, differentSecret, {
          from: randomlySelectedVerifier
        })

        debug(`applicantRevealSecret() failed applicantRevealSecret(${secret}, ${random})...`)
        await coordinationGame.applicantRevealSecret(
          applicationId,
          secret,
          random.toString(),
          { from: applicant }
        )

        debug(`applicantRevealSecret() failed getListingHash(${applicationId})...`)
        const listingHash = await coordinationGame.getListingHash(applicationId)

        debug(`applicantRevealSecret() failed listings(${listingHash})...`)
        const listing = await tilRegistry.listings(listingHash)

        assert.notEqual(listing[4].toString(), '0', 'application is challenged')
        assert.notEqual(listing[1], true, 'application is not whitelisted')
      })
    })
  })
})
