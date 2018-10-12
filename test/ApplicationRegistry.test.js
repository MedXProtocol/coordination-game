const ApplicationRegistry = artifacts.require('ApplicationRegistry.sol')
const Work = artifacts.require('Work.sol')
const BN = require('bn.js')
const WorkToken = artifacts.require('WorkToken.sol')
const debug = require('debug')('ApplicationRegistry.test.js')

contract('ApplicationRegistry', (accounts) => {
  let applicationRegistry, workToken, work

  const applicant = accounts[0]
  const verifier = accounts[1]

  const secret = web3.utils.utf8ToHex("This is the secret")
  const random = new BN("4312341235")
  const hint = web3.utils.utf8ToHex("Totally bogus hint")

  debug(`using secret ${secret} and random ${random}`)

  const secretRandomHash = web3.utils.soliditySha3(secret, random)
  const randomHash = web3.utils.soliditySha3(random)

  before(async () => {
    work = await Work.deployed()
    workToken = await WorkToken.deployed()
    stake = await work.requiredStake()
    debug(`Minting ${stake.toString()}...`)
    await workToken.mint(verifier, stake)
    debug(`Approving ${stake.toString()} to ${work.address}...`)
    await workToken.approve(work.address, stake, { from: verifier })
    await work.depositStake({ from: verifier })
  })

  beforeEach(async () => {
    applicationRegistry = await ApplicationRegistry.new(work.address)
  })

  describe('apply()', () => {
    it('should allow a user to apply', async () => {
      await applicationRegistry.apply(
        secretRandomHash,
        randomHash,
        hint,
        {
          from: applicant
        }
      )

      const index = await applicationRegistry.applicationIndex(applicant)
      const storedSecretRandomHash = await applicationRegistry.secretAndRandomHash(index)
      const storedRandomHash = await applicationRegistry.randomHash(index)
      const storedHint = await applicationRegistry.hint(index)
      const selectedVerifier = await applicationRegistry.verifier(index)

      assert.equal(storedRandomHash, randomHash, 'random hash matches')
      assert.equal(storedSecretRandomHash, secretRandomHash, 'secret and random hash matches')
      assert.equal(storedHint, hint, 'hint matches')
      assert.equal(selectedVerifier, verifier, 'verifier matches')
    })
  })

  describe('verify()', () => {
    it('should allow the verifier to submit a secret', async () => {
      await applicationRegistry.apply(
        secretRandomHash,
        randomHash,
        hint,
        {
          from: applicant
        }
      )
      const index = await applicationRegistry.applicationIndex(applicant)
      await applicationRegistry.verify(index, secret, { from: verifier })
      const storedVerifierSecret = await applicationRegistry.verifierSecret(index)
      assert.equal(secret, storedVerifierSecret)
    })
  })

  describe('reveal()', () => {
    it('should allow the applicant to reveal their secret', async () => {
      await applicationRegistry.apply(
        secretRandomHash,
        randomHash,
        hint,
        {
          from: applicant
        }
      )
      const index = await applicationRegistry.applicationIndex(applicant)
      await applicationRegistry.verify(index, secret, { from: verifier })
      await applicationRegistry.reveal(secret, random, { from : applicant })
      const storedSecret = await applicationRegistry.applicantSecret(index)
      assert.equal(storedSecret, secret)
    })
  })
})
