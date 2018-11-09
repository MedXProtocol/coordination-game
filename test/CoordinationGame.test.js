const EtherPriceFeed = artifacts.require('EtherPriceFeed.sol')
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
const leftPadHexString = require('./helpers/leftPadHexString')

contract('CoordinationGame', (accounts) => {
  let coordinationGame,
    coordinationGameOwnerAddress,
    etherPriceFeed,
    workToken,
    work,
    workStake,
    minDeposit,
    parameterizer,
    tilRegistry,
    applicationId,
    applicantRevealTimeoutInDays,
    verifierTimeoutInDays,
    secondsInADay

  const applicant = accounts[0]
  const verifier = accounts[1]
  const verifier2 = accounts[2]

  const secret = leftPadHexString(web3.toHex(new BN(600)), 32)
  const random = new BN("4312341235")
  const hint = web3.toHex("Totally bogus hint")

  const baseApplicationFeeUsdWei = web3.toWei('25', 'ether') // the cost to apply in Eth
  const applicationStakeAmount = web3.toWei('20', 'ether') // the cost to apply in tokens

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
    etherPriceFeed = await EtherPriceFeed.deployed()
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
      etherPriceFeed.address,
      work.address,
      'TILRegistry',
      applicationStakeAmount,
      baseApplicationFeeUsdWei
    )

    tilRegistry = await TILRegistry.at(addresses.tilRegistryAddress)
    assert.equal((await tilRegistry.token()), workToken.address, 'token addresses match')

    const tilRegistryOwnerAddress = await tilRegistry.owner.call()
    assert.equal(tilRegistryOwnerAddress, applicant, 'tilRegistry owner is first account')

    const coordinationGameAddress = await tilRegistry.coordinationGame()
    coordinationGame = await CoordinationGame.at(coordinationGameAddress)

    coordinationGameOwnerAddress = await coordinationGame.owner.call()
    assert.equal(coordinationGameOwnerAddress, applicant, 'coord game owner is first account')

    debug(`Setting baseApplicationFeeUsdWei in CoordinationGame contract to: ${baseApplicationFeeUsdWei}`)
    await coordinationGame.setBaseApplicationFeeUsdWei(baseApplicationFeeUsdWei)

    await work.setJobManager(coordinationGameAddress)

    secondsInADay = await coordinationGame.secondsInADay()
    debug(`secondsInADay is ${secondsInADay.toString()}`)

    // Add one to the timeouts so that we can use them to increaseTime and timeout
    applicantRevealTimeoutInDays = await coordinationGame.applicantRevealTimeoutInDays()
    applicantRevealTimeoutInDays = new BN(applicantRevealTimeoutInDays.toString()).add(new BN(1))
    debug(`applicantRevealTimeoutInDays is ${applicantRevealTimeoutInDays.toString()}`)

    // Add one to the timeouts so that we can use them to increaseTime and timeout
    verifierTimeoutInDays = await coordinationGame.verifierTimeoutInDays()
    verifierTimeoutInDays = new BN(verifierTimeoutInDays.toString()).add(new BN(1))
    debug(`verifierTimeoutInDays is ${verifierTimeoutInDays.toString()}`)

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
    const weiPerApplication = (await coordinationGame.weiPerApplication()).toString()

    await coordinationGame.start(
      secretRandomHash,
      randomHash,
      hint,
      {
        from: applicant,
        value: weiPerApplication
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

  describe('selectVerifier()', () => {
    it('should skip the applicant when they select themselves', async () => {
      const zeroVerifier = await work.selectWorker(0)
      assert.equal(zeroVerifier, verifier)
      const selectedVerifier = await coordinationGame.selectVerifier(verifier, 0);
      assert.equal(selectedVerifier, verifier2)
    })
  })

  describe('start()', () => {
    it('should allow a user to start the game', async () => {
      let applicantsApplicationCount

      var appCount = await coordinationGame.getApplicantsApplicationCount({
        from: applicant
      })

      applicantsApplicationCount = new BN(appCount.toString())
      assert.equal(applicantsApplicationCount.toString(), new BN(0).toString(), "Applicant's Application Count was 0")

      await newApplicantStartsGame()

      const storedSecretRandomHash = await coordinationGame.secretAndRandomHashes(applicationId)
      const storedRandomHash = await coordinationGame.randomHashes(applicationId)
      const storedHint = await coordinationGame.hints(applicationId)

      assert.equal(storedRandomHash, randomHash, 'random hash matches')
      assert.equal(storedSecretRandomHash, secretRandomHash, 'secret and random hash matches')
      assert.equal(storedHint, hint, 'hint matches')

      appCount = await coordinationGame.getApplicantsApplicationCount({
        from: applicant
      })

      applicantsApplicationCount = new BN(appCount.toString())
      assert.equal(applicantsApplicationCount.toString(), new BN(1).toString(), "Applicant's Application Count increased")

      assert.equal(
        (await coordinationGame.applicantTokenDeposits(1)).toString(),
        (await coordinationGame.minDeposit()).toString()
      )

      const weiPerApplication = (await coordinationGame.weiPerApplication()).toString()
      assert.equal(
        (await coordinationGame.applicationBalancesInWei(1)).toString(),
        weiPerApplication
      )
    })

    it('should not allow starting an application without enough ether passed', async () => {
      await expectThrow(async () => {
        await coordinationGame.start(
          secretRandomHash,
          randomHash,
          hint,
          {
            from: applicant,
            value: 1234
          }
        )
      })
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

        const verifiersApplicationCount = new BN((await coordinationGame.getVerifiersApplicationCount({
          from: selectedVerifier
        })).toString())
        assert.equal(verifiersApplicationCount.toString(), new BN(1).toString(), "Verifier's Application Count increased")
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
            debug(`increaseTime(${verifierTimeoutInDays * secondsInADay})...`)
            await increaseTime(verifierTimeoutInDays * secondsInADay)
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
          debug(`increaseTime(${verifierTimeoutInDays * secondsInADay})...`)
          await increaseTime(verifierTimeoutInDays * secondsInADay)
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
      debug(`increaseTime(${verifierTimeoutInDays * secondsInADay})...`)
      await increaseTime(verifierTimeoutInDays * secondsInADay)

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
        debug(`increaseTime(${applicantRevealTimeoutInDays * secondsInADay})...`)
        await increaseTime(applicantRevealTimeoutInDays * secondsInADay)

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
      //   await increaseTime(applicantRevealTimeoutInDays)
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
    const newBaseApplicationFeeUsdWei = web3.toWei('30', 'ether')

    const newSecondsInADay = 2000
    const newVerifierTimeoutInDays = 1
    const newApplicantRevealTimeoutInDays = 2

    it('should work for the contract owner', async () => {
      assert.equal(await coordinationGame.applicationStakeAmount(), applicationStakeAmount)
      assert.equal(await coordinationGame.baseApplicationFeeUsdWei(), baseApplicationFeeUsdWei)

      assert.equal(await coordinationGame.secondsInADay(), secondsInADay)
      assert.equal(await coordinationGame.verifierTimeoutInDays(), verifierTimeoutInDays)
      assert.equal(await coordinationGame.applicantRevealTimeoutInDays(), applicantRevealTimeoutInDays)

      await coordinationGame.updateSettings(
        newApplicationStakeAmount,
        newBaseApplicationFeeUsdWei,
        newSecondsInADay,
        newVerifierTimeoutInDays,
        newApplicantRevealTimeoutInDays,
        {
          from: coordinationGameOwnerAddress
        }
      )

      assert.equal(await coordinationGame.applicationStakeAmount(), newApplicationStakeAmount)
      assert.equal(await coordinationGame.baseApplicationFeeUsdWei(), newBaseApplicationFeeUsdWei)

      assert.equal(await coordinationGame.secondsInADay(), newSecondsInADay)
      assert.equal(await coordinationGame.verifierTimeoutInDays(), newVerifierTimeoutInDays)
      assert.equal(await coordinationGame.applicantRevealTimeoutInDays(), newApplicantRevealTimeoutInDays)
    })

    it('should not work for anyone but the owner', async () => {
      await expectThrow(async () => {
        await coordinationGame.updateSettings(
          newApplicationStakeAmount,
          newBaseApplicationFeeUsdWei,
          newSecondsInADay,
          newVerifierTimeoutInDays,
          newApplicantRevealTimeoutInDays
          {
            from: verifier
          }
        )
      })
    })
  })

  describe('usdWeiPerEther()', () => {
    it('should be read from the ether price feed', async () => {
      assert.equal((await coordinationGame.usdWeiPerEther()).toString(), web3.toWei('210.83', 'ether'))
    })
  })

  describe('weiPerApplication()', () => {
    it('should dynamically calculate the application fee', async () => {
      assert.equal((await coordinationGame.weiPerApplication()).toString(), '118578949864819000')
    })
  })

  describe('setBaseApplicationFeeUsdWei(uint256)', () => {
    it('should update the base application fee', async () => {
      await coordinationGame.setBaseApplicationFeeUsdWei(web3.toWei('15', 'ether'))
      assert.equal((await coordinationGame.weiPerApplication()).toString(), '71147369918891000')
    })
  })

})
