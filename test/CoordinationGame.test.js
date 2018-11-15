const EtherPriceFeed = artifacts.require('EtherPriceFeed.sol')
const CoordinationGame = artifacts.require('CoordinationGame.sol')
const TILRegistry = artifacts.require('TILRegistry.sol')
const TILRoles = artifacts.require('TILRoles.sol')
const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')

const abi = require('ethereumjs-abi')
const BN = require('bn.js')
const debug = require('debug')('CoordinationGame.test.js')
const tdr = require('truffle-deploy-registry')
const createCoordinationGame = require('../migrations/support/createCoordinationGame')
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
    tilRegistry,
    applicationId,
    applicationVerifier,
    applicantRevealTimeoutInSeconds,
    verifierTimeoutInSeconds,
    roles,
    weiPerApplication

  const applicant = accounts[0]
  const verifier = accounts[1]
  const verifier2 = accounts[2]

  const tokenTicker = leftPadHexString(web3.toHex("BOGUS"), 32)
  const tokenName   = leftPadHexString(web3.toHex("Bogus, The Currency"), 32)

  const secret = leftPadHexString(web3.toHex(new BN(600)), 32)
  const random = new BN("4312341235")

  const baseApplicationFeeUsdWei = web3.toWei('25', 'ether') // the cost to apply in Eth
  const applicationStakeAmount = web3.toWei('10', 'ether') // the cost to apply in tokens

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
    jobStake = await work.jobStake()
    roles = await TILRoles.deployed()

    await registerWorker(verifier)
    await registerWorker(verifier2)
  })

  beforeEach(async () => {
    tilRegistry = await TILRegistry.new(workToken.address, roles.address, work.address)
    assert.equal((await tilRegistry.token()), workToken.address, 'token addresses match')
    assert.equal(await tilRegistry.owner.call(), applicant, 'tilRegistry owner is first account')

    coordinationGame = await CoordinationGame.new(
      etherPriceFeed.address, work.address, tilRegistry.address, applicationStakeAmount, baseApplicationFeeUsdWei
    )

    weiPerApplication = await coordinationGame.weiPerApplication()

    await roles.setRole(coordinationGame.address, 1, true)

    coordinationGameOwnerAddress = await coordinationGame.owner.call()
    assert.equal(coordinationGameOwnerAddress, applicant, 'coord game owner is first account')

    // Add one to the timeouts so that we can use them to increaseTime and timeout
    applicantRevealTimeoutInSeconds = await coordinationGame.applicantRevealTimeoutInSeconds()
    applicantRevealTimeoutInSeconds = new BN(applicantRevealTimeoutInSeconds.toString()).add(new BN(1))
    debug(`applicantRevealTimeoutInSeconds is ${applicantRevealTimeoutInSeconds.toString()}`)

    // Add one to the timeouts so that we can use them to increaseTime and timeout
    verifierTimeoutInSeconds = await coordinationGame.verifierTimeoutInSeconds()
    verifierTimeoutInSeconds = new BN(verifierTimeoutInSeconds.toString()).add(new BN(1))
    debug(`verifierTimeoutInSeconds is ${verifierTimeoutInSeconds.toString()}`)

    debug(`Minting Deposit to Applicant ${workStake.toString()}...`)
    await workToken.mint(applicant, workStake)

    debug(`Approving CoordinationGame to spend ${workStake.toString()} for applicant...`)
    await workToken.approve(coordinationGame.address, workStake, { from: applicant })
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
    applicationVerifier = await coordinationGame.verifiers(applicationId)
  }

  async function newApplicantStartsGame() {
    await coordinationGame.start(
      secretRandomHash,
      randomHash,
      tokenTicker,
      tokenName,
      {
        from: applicant,
        value: weiPerApplication.toString()
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

  async function verifierChallenges(selectedVerifier) {
    debug(`verifierChallenges`)
    await coordinationGame.verifierChallenge(applicationId, { from: selectedVerifier })
  }

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

      const storedTokenTicker = await coordinationGame.tokenTickers(applicationId)
      const storedTokenName = await coordinationGame.tokenNames(applicationId)

      const storedSecretRandomHash = await coordinationGame.secretAndRandomHashes(applicationId)
      const storedRandomHash = await coordinationGame.randomHashes(applicationId)

      assert.equal(storedTokenTicker, tokenTicker, 'tokenTicker matches')
      assert.equal(storedTokenName, tokenName, 'tokenName matches')

      assert.equal(storedRandomHash, randomHash, 'random hash matches')
      assert.equal(storedSecretRandomHash, secretRandomHash, 'secret and random hash matches')

      appCount = await coordinationGame.getApplicantsApplicationCount({
        from: applicant
      })

      applicantsApplicationCount = new BN(appCount.toString())
      assert.equal(applicantsApplicationCount.toString(), new BN(1).toString(), "Applicant's Application Count increased")

      assert.equal(
        (await coordinationGame.applicantTokenDeposits(1)).toString(),
        jobStake.toString()
      )

      assert.equal(
        (await coordinationGame.applicationBalancesInWei(1)).toString(),
        weiPerApplication.toString()
      )
    })

    it('should not allow starting an application without enough ether passed', async () => {
      await expectThrow(async () => {
        await coordinationGame.start(
          secretRandomHash,
          randomHash,
          tokenTicker,
          tokenName,
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
            debug(`increaseTime(${verifierTimeoutInSeconds})...`)
            await increaseTime(verifierTimeoutInSeconds)
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
          debug(`increaseTime(${verifierTimeoutInSeconds})...`)
          await increaseTime(verifierTimeoutInSeconds)
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
      debug(`increaseTime(${verifierTimeoutInSeconds})...`)
      await increaseTime(verifierTimeoutInSeconds)

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

        assert.equal(listing[2], 0, 'application is listed')
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

        assert.equal(listing[2], 1, 'application is challenged')
      })
    })

    describe('when the timeframe for the applicant to reveal has passed', () => {
      it('should throw', async () => {
        debug(`increaseTime(${applicantRevealTimeoutInSeconds})...`)
        await increaseTime(applicantRevealTimeoutInSeconds)

        await expectThrow(async () => {
          await applicantRevealsTheirSecret()
        })
      })

      it('should allow the verifier to challenge', async () => {
        const selectedVerifier = await coordinationGame.verifiers(applicationId)

        await verifierSubmitSecret()
        await expectThrow(async () => {
          await verifierChallenges(selectedVerifier)
        })
        await increaseTime(applicantRevealTimeoutInSeconds)

        const verifierStartingBalance = (await work.balances(selectedVerifier)).toNumber()
        const applicantStartingBalance = (await workToken.balanceOf(applicant)).toNumber()
        const verifierEtherStartingBalance = (await web3.eth.getBalance(selectedVerifier)).toNumber()
        const applicantEtherDeposit = (await coordinationGame.applicationBalancesInWei(applicationId)).toNumber()

        debug(`verifier balance: ${verifierStartingBalance.toString()}`)
        debug(`applicant balance: ${applicantStartingBalance.toString()}`)
        assert.equal(jobStake.toString(), applicationStakeAmount.toString())
        await verifierChallenges(selectedVerifier)

        const verifierFinishingBalance = (await work.balances(selectedVerifier)).toNumber()
        const verifierEtherFinishingBalance = (await web3.eth.getBalance(selectedVerifier)).toNumber()
        const applicantFinishingBalance = (await workToken.balanceOf(applicant)).toNumber()

        debug(`verifier finishing balance: ${verifierFinishingBalance}`)
        debug(`applicant finishing balance: ${applicantFinishingBalance}`)

        assert.ok(
          verifierEtherFinishingBalance - verifierEtherStartingBalance > (applicantEtherDeposit * 0.98), // minus gas
          'verifier was paid in ether'
        )
        assert.equal(verifierFinishingBalance, verifierStartingBalance + jobStake.toNumber(), 'verifier deposit was returned')
        assert.equal(applicantFinishingBalance, applicantStartingBalance + jobStake.toNumber(), 'applicant deposit was returned')

        debug(`applicantRevealSecret() failed getListingHash(${applicationId})...`)
        const listingHash = await coordinationGame.getListingHash(applicationId)

        debug(`applicantRevealSecret() failed listings(${listingHash})...`)
        const listing = await tilRegistry.listings(listingHash)

        /// These assertions essentially make sure there is no listing
        assert.equal(listing[0].toString(), '0x0000000000000000000000000000000000000000', 'there is no owner')
      })
    })
  })

  describe('when updating settings', () => {
    const newApplicationStakeAmount = web3.toWei('30', 'ether')
    const newBaseApplicationFeeUsdWei = web3.toWei('30', 'ether')

    const newVerifierTimeoutInSeconds = 86400
    const newApplicantRevealTimeoutInSeconds = 172800

    it('should work for the contract owner', async () => {
      assert.equal((await coordinationGame.applicationStakeAmount()).toString(), applicationStakeAmount.toString())
      assert.equal((await coordinationGame.baseApplicationFeeUsdWei()).toString(), baseApplicationFeeUsdWei.toString())

      await coordinationGame.updateSettings(
        newApplicationStakeAmount,
        newBaseApplicationFeeUsdWei,
        newVerifierTimeoutInSeconds,
        newApplicantRevealTimeoutInSeconds,
        {
          from: coordinationGameOwnerAddress
        }
      )

      assert.equal(await coordinationGame.applicationStakeAmount(), newApplicationStakeAmount)
      assert.equal(await coordinationGame.baseApplicationFeeUsdWei(), newBaseApplicationFeeUsdWei)

      assert.equal(await coordinationGame.verifierTimeoutInSeconds(), newVerifierTimeoutInSeconds)
      assert.equal(await coordinationGame.applicantRevealTimeoutInSeconds(), newApplicantRevealTimeoutInSeconds)
    })

    it('should not work for anyone but the owner', async () => {
      await expectThrow(async () => {
        await coordinationGame.updateSettings(
          newApplicationStakeAmount,
          newBaseApplicationFeeUsdWei,
          newVerifierTimeoutInSeconds,
          newApplicantRevealTimeoutInSeconds,
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

  describe('whistleblow()', () => {
    beforeEach(async () => {
      await newApplicantStartsGame()
    })

    it('should give applicant ether and tokens to the whistleblower', async () => {
      const blowerTokenBalance = await workToken.balanceOf(verifier2)
      const blowerEtherBalance = await web3.eth.getBalance(verifier2)

      debug(`whistleblow() ${typeof applicationId}, ${typeof random}`)

      await coordinationGame.whistleblow(
        applicationId.toString(), random.toString(),
        { from: verifier2 }
      )

      const blowerNewTokenBalance = await workToken.balanceOf(verifier2)
      const blowerNewEtherBalance = await web3.eth.getBalance(verifier2)
      assert.equal(
        blowerNewTokenBalance.toString(), blowerTokenBalance.plus(applicationStakeAmount).toString(),
        'token balances match'
      )
      assert.ok(
        blowerNewEtherBalance.sub(blowerEtherBalance).gt(weiPerApplication.mul(0.98)),
        'ether balances match'
      )
      assert.equal(
        await coordinationGame.whistleblowers(applicationId), verifier2,
        'whistleblower has been set'
      )
    })

    context('when called after a verifier has been selected', () => {
      beforeEach(async () => {
        await applicantRandomlySelectsAVerifier()
      })

      it('should return the verifiers job stake', async () => {
        const verifierTokenBalance = await work.balances(applicationVerifier)
        const verifierEtherBalance = await web3.eth.getBalance(applicationVerifier)

        debug(`verifier: ${applicationVerifier}`)
        debug(`verifierTokenBalance: ${verifierTokenBalance.toString()}`)

        await coordinationGame.whistleblow(
          applicationId.toString(), random.toString(),
          { from: verifier2 }
        )

        const verifierNewTokenBalance = await work.balances(applicationVerifier)
        const verifierNewEtherBalance = await web3.eth.getBalance(applicationVerifier)

        debug(`verifierNewTokenBalance: ${verifierNewTokenBalance.toString()}`)

        assert.equal(
          verifierNewTokenBalance.toString(), verifierTokenBalance.plus(jobStake).toString(),
          'token balances match'
        )
      })
    })
  })
})
