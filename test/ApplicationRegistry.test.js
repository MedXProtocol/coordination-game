const ApplicationRegistry = artifacts.require('ApplicationRegistry.sol')
const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const debug = require('debug')('ApplicationRegistry.test.js')

contract('ApplicationRegistry', (accounts) => {
  let applicationRegistry, workToken, work

  const applicant = accounts[0]
  const verifier = accounts[1]

  before(async () => {
    applicationRegistry = await ApplicationRegistry.deployed()
    work = await Work.deployed()
    workToken = await WorkToken.deployed()
    stake = await work.requiredStake()
    debug(`Minting ${stake.toString()}...`)
    await workToken.mint(verifier, stake)
    debug(`Approving ${stake.toString()} to ${work.address}...`)
    await workToken.approve(work.address, stake, { from: verifier })
    await work.depositStake({ from: verifier })
  })

  describe('apply()', () => {
    it('should allow a user to apply', async () => {

      const secret = "This is the secret"
      const random = "4312341235"
      const hint = web3.utils.utf8ToHex("Totally bogus hint")

      const secretRandomHash = web3.utils.soliditySha3(secret + random)
      const randomHash = web3.utils.soliditySha3(random)

      await applicationRegistry.apply(
        secretRandomHash,
        randomHash,
        hint,
        {
          from: applicant
        }
      )

      const index = await applicationRegistry.applicationIndex(accounts[0])
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
})
