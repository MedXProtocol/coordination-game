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
const mineBlock = require('./helpers/mineBlock')

contract('CoordinationGame', (accounts) => {
  let coordinationGame,
      coordinationGameOwnerAddress,
      workToken,
      work,
      workStake,
      minDeposit,
      parameterizer,
      tilRegistry,
      applicationId,
      applicantRevealTimeout,
      verifierTimeout

  const applicant = accounts[0]
  const verifier = accounts[1]
  const verifier2 = accounts[2]

  const secret = '0x85dd39c91a64167ba20732b228251e67caed1462d4bcf036af88dc6856d0fdcc'
  const random = new BN("4312341235")
  const hint = web3.toHex("Totally bogus hint")

  const applicationStakeAmount = web3.toWei('20', 'ether') // the cost to apply

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
    workStake = await work.requiredStake()
    const parameterizerAddress = (await tdr.findLastByContractName(
      web3.version.network,
      'Parameterizer'
    )).address
    parameterizer = await Parameterizer.at(parameterizerAddress)
    minDeposit = await parameterizer.get('minDeposit')

    assert.equal((await parameterizer.token()), workToken.address, 'parameterizer token matches work token')

    await registerWorker(verifier)
    await registerWorker(verifier2)
  })

  beforeEach(async () => {
    assert.equal((await parameterizer.token()), workToken.address, 'parameterizer token matches work token')

    tilRegistryFactoryInstance = await TILRegistryFactory.deployed()
    const addresses = await createTILRegistry(
      tilRegistryFactoryInstance,
      parameterizer.address,
      work.address,
      'TILRegistry',
      applicationStakeAmount
    )

    tilRegistry = TILRegistry.at(addresses.tilRegistryAddress)
    assert.equal((await tilRegistry.token()), workToken.address, 'token addresses match')

    const tilRegistryOwnerAddress = await tilRegistry.owner.call()
    assert.equal(tilRegistryOwnerAddress, applicant, 'tilRegistry owner is first account')

    const coordinationGameAddress = await tilRegistry.coordinationGame()
    coordinationGame = await CoordinationGame.at(coordinationGameAddress)

    coordinationGameOwnerAddress = await coordinationGame.owner.call()
    assert.equal(coordinationGameOwnerAddress, applicant, 'coord game owner is first account')

    await work.setJobManager(coordinationGameAddress)

    // Add one to the timeouts so that we can use them to increaseTime and timeout
    applicantRevealTimeout = await coordinationGame.applicantRevealTimeout()
    applicantRevealTimeout = new BN(applicantRevealTimeout.toString()).add(new BN(1))
    debug(`applicantRevealTimeout is ${applicantRevealTimeout.toString()}`)

    verifierTimeout = await coordinationGame.verifierTimeout()
    verifierTimeout = new BN(verifierTimeout.toString()).add(new BN(1))
    debug(`verifierTimeout is ${verifierTimeout.toString()}`)

    debug(`Minting Deposit to Applicant ${minDeposit.toString()}...`)
    await workToken.mint(applicant, minDeposit)

    debug(`Approving CoordinationGame to spend ${minDeposit.toString()} for applicant...`)
    await workToken.approve(coordinationGameAddress, minDeposit, { from: applicant })
  })

  async function registerWorker(address) {
    debug(`Minting Stake to ${address}...`)
    await workToken.mint(address, workStake)

    debug(`Approving workStake ${workStake.toString()} to ${work.address} for ${address}...`)
    await workToken.approve(work.address, workStake, { from: address })
    await work.depositStake({ from: address })
  }

  async function applicantRandomlySelectsAVerifier() {
    await mineBlock()
    await coordinationGame.applicantRandomlySelectVerifier(
      applicationId,
      {
        from: applicant
      }
    )
  }

  async function newApplicantStartsGame() {
    await coordinationGame.start(
      secretRandomHash,
      randomHash,
      hint,
      {
        from: applicant
      }
    )
    applicationId = await coordinationGame.getApplicantsLastApplicationID({ from: applicant })
  }

  async function applicantRevealsTheirSecret() {
    debug(`applicantRevealsTheirSecret`)
    await coordinationGame.applicantRevealSecret(
      applicationId,
      secret,
      random.toString(),
      {
        from: applicant
      }
    )
  }

  async function verifierSubmitSecret(_secret) {
    if (!_secret) { _secret = secret }
    debug(`verifierSubmitSecret`)
    let selectedVerifier = await coordinationGame.verifiers(applicationId)
    await coordinationGame.verifierSubmitSecret(applicationId, _secret, {
      from: selectedVerifier
    })
  }

  // async function verifierChallenges(selectedVerifier) {
  //   debug(`verifierChallenges`)
  //   await coordinationGame.verifierChallenge(applicationId, { from: selectedVerifier })
  // }


  describe('start()', () => {
    it('should allow a user to start the game', async () => {
      await newApplicantStartsGame()

      const storedSecretRandomHash = await coordinationGame.secretAndRandomHashes(applicationId)
      const storedRandomHash = await coordinationGame.randomHashes(applicationId)
      const storedHint = await coordinationGame.hints(applicationId)

      assert.equal(storedRandomHash, randomHash, 'random hash matches')
      assert.equal(storedSecretRandomHash, secretRandomHash, 'secret and random hash matches')
      assert.equal(storedHint, hint, 'hint matches')
    })
  })


  describe('applicantRandomlySelectVerifier()', () => {
    it('should not work before the next block has been mined', async () => {
      await expectThrow(async () => {
        await coordinationGame.applicantRandomlySelectVerifier(
          applicationId,
          {
            from: applicant
          }
        )
      })
    })

    context('after being called successfully', () => {
      let verifierStartingBalance,
          workBalance

      beforeEach(async () => {
        verifierStartingBalance = await workToken.balanceOf(verifier)
        workBalance = await workToken.balanceOf(work.address)
        await newApplicantStartsGame()
        await applicantRandomlySelectsAVerifier()
      })

      it('should set the verifier', async () => {
        const selectedVerifier = await coordinationGame.verifiers(applicationId)
        assert([verifier, verifier2].includes(selectedVerifier), '1st verifier matches')
      })

      it('should not be called again', async () => {
        await expectThrow(async () => {
          await applicantRandomlySelectsAVerifier()
        })
      })

      context('if the verifier has submitted', () => {
        beforeEach(async () => {
          await verifierSubmitSecret()
        })

        it('should not allow the applicant to select another verifier', async () => {
          debug(`fault applicantRandomlySelectsAVerifier...`)
          await expectThrow(async () => {
            await applicantRandomlySelectsAVerifier()
          })
        })

        context('and the verifier submission period has ended', () => {
          beforeEach(async () => {
            debug(`increaseTime(${verifierTimeout})...`)
            await increaseTime(verifierTimeout)
          })

          it('should not allow the applicant to select another verifier', async () => {
            debug(`fault applicantRandomlySelectsAVerifier...`)
            await expectThrow(async () => {
              await applicantRandomlySelectsAVerifier()
            })
          })
        })
      })

      context('if the verifier submission period has ended', () => {
        beforeEach(async () => {
          debug(`increaseTime(${verifierTimeout})...`)
          await increaseTime(verifierTimeout)
        })

        it('should allow the applicant to select another verifier', async () => {
          const firstVerifier = await coordinationGame.verifiers(applicationId)

          await applicantRandomlySelectsAVerifier()

          const newVerifier = await coordinationGame.verifiers(applicationId)
          assert([verifier, verifier2].includes(newVerifier), 'new verifier matches')
          assert.notEqual(newVerifier, firstVerifier, 'new verifier is not first verifier')
        })
      })
    })
  })

  describe('verifierSubmitSecret()', () => {
    beforeEach(async () => {
      await newApplicantStartsGame()
      await applicantRandomlySelectsAVerifier()
    })

    context('when called successfully', () => {
      beforeEach(async () => {
        await verifierSubmitSecret()
      })

      it('should set the verifier secret', async () => {
        debug('verifierSubmitSecret() verifierSubmitSecret')
        const storedVerifierSecret = await coordinationGame.verifierSecrets(applicationId)
        assert.equal(secret, storedVerifierSecret)
      })

      it('should not be called again', async () => {
        await expectThrow(async () => {
          await verifierSubmitSecret()
        })
      })
    })

    it('should not allow the verifier to submit if too much time has passed', async () => {
      await increaseTime(verifierTimeout)

      await expectThrow(async () => {
        await verifierSubmitSecret()
      })
    })
  })

  describe('applicantRevealSecret()', () => {
    beforeEach(async () => {
      await newApplicantStartsGame()
      debug(`applicantRevealSecret() won getApplicantsLastApplicationID(${applicant})...`)
      await applicantRandomlySelectsAVerifier()
    })

    it('should not be called before the verifier has submitted', async () => {
      await expectThrow(async () => {
        await applicantRevealsTheirSecret()
      })
    })

    context('when the verifier has submitted a matching secret', async () => {
      beforeEach(async () => {
        await verifierSubmitSecret()
      })

      it('should add applicant to registry (and pay out verifier)', async () => {
        await applicantRevealsTheirSecret()

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

    context('when the verifier has submitted different secret', async () => {
      it('should make a challenge and go to vote', async () => {
        const differentSecret = '0x56'

        debug(`applicantRevealSecret() failed verifierSubmitSecret(${applicationId}, ${secret})...`)
        await verifierSubmitSecret(differentSecret)

        debug(`applicantRevealSecret() failed applicantRevealSecret(${secret}, ${random})...`)
        await applicantRevealsTheirSecret()

        debug(`applicantRevealSecret() failed getListingHash(${applicationId})...`)
        const listingHash = await coordinationGame.getListingHash(applicationId)

        debug(`applicantRevealSecret() failed listings(${listingHash})...`)
        const listing = await tilRegistry.listings(listingHash)

        assert.notEqual(listing[4].toString(), '0', 'application is challenged')
        assert.notEqual(listing[1], true, 'application is not whitelisted')
      })
    })

    describe('when the timeframe for the applicant to reveal has passed', () => {
      it('should throw', async () => {
        await increaseTime(applicantRevealTimeout)

        await expectThrow(async () => {
          await applicantRevealsTheirSecret()
        })
      })

      // it('should allow the verifier to challenge', async () => {
      //   const selectedVerifier = await coordinationGame.verifiers(applicationId)
      //   const verifierStartingBalance = new BN((await work.balances(selectedVerifier)).toString())
      //   const applicantStartingBalance = new BN((await workToken.balanceOf(applicant)).toString())
      //
      //   debug(`applicantRevealSecret() won verifierSubmitSecret(${applicationId}, ${secret})...`)
      //   await verifierSubmitSecret()
      //   await expectThrow(async () => {
      //     await verifierChallenges(selectedVerifier)
      //   })
      //   await increaseTime(applicantRevealTimeout)
      //   await verifierChallenges(selectedVerifier)
      //
      //   const verifierFinishingBalance = new BN((await work.balances(selectedVerifier)).toString())
      //   const applicantFinishingBalance = new BN((await workToken.balanceOf(applicant)).toString())
      //
      //   assert.equal(verifierFinishingBalance.toString(), verifierStartingBalance.toString(), 'verifier deposit was returned')
      //   assert.equal(applicantStartingBalance.toString(), applicantFinishingBalance.toString(), 'applicant deposit was returned')
      //
      //   debug(`applicantRevealSecret() failed getListingHash(${applicationId})...`)
      //   const listingHash = await coordinationGame.getListingHash(applicationId)
      //
      //   debug(`applicantRevealSecret() failed listings(${listingHash})...`)
      //   const listing = await tilRegistry.listings(listingHash)
      //
      //   /// These assertions essentially make sure there is no listing
      //   assert.equal(listing[2].toString(), '0', 'there is no owner')
      //   assert.equal(listing[0], '0', 'application has no expiry')
      // })
    })
  })

  describe('when updating settings', () => {
    const newApplicationStakeAmount = web3.toWei('30', 'ether')

    it('should work for the contract owner', async () => {
      assert.equal(await coordinationGame.applicationStakeAmount(), applicationStakeAmount)

      // y u no work?
      await coordinationGame.updateSettings(newApplicationStakeAmount, {
        from: coordinationGameOwnerAddress
      })

      assert.equal(await coordinationGame.applicationStakeAmount(), newApplicationStakeAmount)
    })

    it('should not work for anyone but the owner', async () => {
      await expectThrow(async () => {
        await coordinationGame.updateSettings(newApplicationStakeAmount, {
          from: verifier
        })
      })
    })
  })

})
