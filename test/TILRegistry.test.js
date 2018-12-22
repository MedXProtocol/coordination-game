const TILRegistry = artifacts.require('TILRegistry.sol')
const TILRoles = artifacts.require('TILRoles.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const PowerChallenge = artifacts.require('PowerChallenge.sol')
const MockCoordinationGame = artifacts.require('MockCoordinationGame.sol')
const Work = artifacts.require('Work.sol')

const abi = require('ethereumjs-abi')
const BN = require('bn.js')
const debug = require('debug')('TILRegistry.test.js')
const expectThrow = require('./helpers/expectThrow')
const increaseTime = require('./helpers/increaseTime')
const mineBlock = require('./helpers/mineBlock')
const leftPadHexString = require('./helpers/leftPadHexString')
const mapToListing = require('./helpers/mapToListing')
const mapToChallenge = require('./helpers/mapToChallenge')
const isApproxEqualBN = require('./helpers/isApproxEqualBN')

contract('TILRegistry', (accounts) => {
  const [owner, user1, user2, verifier, mysteriousStranger, stranger2] = accounts

  const secret = leftPadHexString(web3.toHex(new BN(600)), 32)
  const hint = web3.toHex("BOGUS")

  const listingStake = new BN(web3.toWei('10', 'ether'))
  const listingHash = '0x1000000000000000000000000000000000000000000000000000000000000000'

  let registry,
      workToken,
      work,
      roles,
      coordinationGame

  const requiredStake = web3.toWei('20', 'ether')
  const jobStake = web3.toWei('20', 'ether')
  const minimumBalanceToWork = web3.toWei('15', 'ether')
  const jobManagerBalance = web3.toWei('1000', 'ether')
  const rewardWei = web3.toWei('25', 'ether')
  const depositAndJobAmount = listingStake.add(new BN(jobStake))

  before(async () => {
    coordinationGame = await MockCoordinationGame.new()
    workToken = await WorkToken.new()
    await workToken.init(owner)
    roles = await TILRoles.new()
    await roles.init(owner)
    await roles.setRole(owner, 0, true) // owner is the token minter
    await roles.setRole(owner, 1, true) // owner is the job manager
    await roles.setRole(coordinationGame.address, 1, true) // coordinationgame is the job manager
    work = await Work.new()
    await workToken.mint(mysteriousStranger, web3.toWei('10000', 'ether'))
    await workToken.mint(stranger2, web3.toWei('10000', 'ether'))
    await workToken.mint(user1, web3.toWei('10000', 'ether'))
    await work.init(
      owner,
      workToken.address,
      requiredStake,
      jobStake,
      minimumBalanceToWork,
      roles.address
    )
  })

  beforeEach(async () => {
    powerChallenge = await PowerChallenge.new()
    await powerChallenge.init(owner, workToken.address, 60)
    await powerChallenge.setRoles(roles.address)
    registry = await TILRegistry.new()
    await roles.setRole(registry.address, 2, true) // Registry is the challenge manager
    await coordinationGame.setRegistry(registry.address)
    await registry.initialize(workToken.address, roles.address, work.address, powerChallenge.address)
    await registry.setCoordinationGame(coordinationGame.address)
    await workToken.mint(owner, depositAndJobAmount.toString())
    await workToken.approve(registry.address, depositAndJobAmount.toString())
  })

  async function getListing(listingHash) {
    return mapToListing(await registry.listings(listingHash))
  }

  async function getChallenge(listingHash) {
    return mapToChallenge(await powerChallenge.challenges(listingHash))
  }

  async function approveListing(user, depositAmount) {
    if (!depositAmount) {
      depositAmount = await powerChallenge.nextDepositAmount(listingHash)
    }
    debug(`approveListing with ${depositAmount}`)
    await workToken.approve(
      powerChallenge.address, depositAmount.toString(), { from: user }
    )
    return await powerChallenge.approve(listingHash, { from: user })
  }

  async function challengeListing(user, depositAmount) {
    if (!depositAmount) {
      depositAmount = await powerChallenge.nextDepositAmount(listingHash)
    }
    await workToken.approve(
      powerChallenge.address, depositAmount.toString(), { from: user }
    )
    return await powerChallenge.challenge(listingHash, { from: user })
  }

  async function nextDepositAmount() {
    return new BN((await powerChallenge.nextDepositAmount(listingHash)).toString())
  }

  describe('applicantWonCoordinationGame()', () => {
    it('should only be called by the job manager', async () => {
      expectThrow(async () => {
        await registry.applicantWonCoordinationGame(listingHash, user1, listingStake.toString(), secret, hint, { from: user2 })
      })
    })

    context('on success', () => {
      let registryTokenBalance

      beforeEach(async () => {
        registryTokenBalance = await workToken.balanceOf(registry.address)
        await registry.applicantWonCoordinationGame(listingHash, user1, listingStake.toString(), secret, hint)
      })

      it('should add an applicant', async () => {
        const registryTokenBalanceAfter = await workToken.balanceOf(registry.address)

        assert.equal(
          registryTokenBalanceAfter.toString(), registryTokenBalance.add(listingStake).toString(),
          'registry transferred the listing deposit'
        )
        assert.equal(await registry.listingsLength(), 1)
        assert.equal(await registry.listingAt(0), listingHash)
      })
    })
  })

  describe('applicantLostCoordinationGame()', () => {
    it('should only be called by the job manager', async () => {
      expectThrow(async () => {
        await registry.applicantLostCoordinationGame(listingHash, user1, listingStake.toString(), secret, hint, 0, 0, 0, { from: user2 })
      })
    })

    context('on success', () => {
      let registryTokenBalance,
          registryEtherBalance,
          powerChallengeTokenBalance,
          powerChallengeEtherBalance

      beforeEach(async () => {
        registryTokenBalance = await workToken.balanceOf(registry.address)
        registryEtherBalance = await web3.eth.getBalance(registry.address)
        powerChallengeTokenBalance = await workToken.balanceOf(powerChallenge.address)
        powerChallengeEtherBalance = await web3.eth.getBalance(powerChallenge.address)
        await registry.applicantLostCoordinationGame(
          listingHash, user1, listingStake.toString(), secret, hint, rewardWei, verifier, jobStake, {
            from: owner,
            value: rewardWei
          }
        )
      })

      it('should add an applicant', async () => {
        let registryFinalTokenBalance = await workToken.balanceOf(registry.address)
        let registryFinalEtherBalance = await web3.eth.getBalance(registry.address)
        let powerChallengeFinalTokenBalance = await workToken.balanceOf(powerChallenge.address)
        let powerChallengeFinalEtherBalance = await web3.eth.getBalance(powerChallenge.address)

        assert.ok(
          isApproxEqualBN(registryFinalEtherBalance, registryEtherBalance.add(rewardWei)),
          'application fee ether was moved into the registry'
        )

        debug(`listingStake: ${listingStake.toString()}, depositAndJobAmount: ${depositAndJobAmount.toString()}`)

        const challenge = await getChallenge(listingHash)

        assert.equal(await powerChallenge.isChallenging(listingHash), true, 'challenge has started')
        assert.equal(challenge.round, 1, 'second round is complete')
        assert.equal(
          challenge.challengeTotal.add(challenge.approveTotal).toString(),
          depositAndJobAmount.toString(), 'total challenge tokens are both deposits')

        assert.equal(
          powerChallengeFinalTokenBalance.toString(),
          powerChallengeTokenBalance.add(depositAndJobAmount).toString(),
          'applicant deposit and work stake were moved into the power challenge'
        )

        const newListing = await getListing(listingHash)

        debug(`applicantLostCoordinationGame(): ${newListing}`)

        assert.equal(newListing.owner, user1, 'owner is applicant') // owned by applicant
        assert.equal(newListing.deposit, listingStake.toString(), 'deposit is set')
      })
    })
  })

  describe('withdrawFromChallenge()', () => {
    beforeEach(async () => {
      await registry.applicantLostCoordinationGame(
        listingHash, user1, listingStake.toString(), secret, hint, rewardWei, verifier, jobStake,
        { from: owner, value: rewardWei }
      )
    })

    context('when challenge failed', () => {
      beforeEach(async () => {
        await approveListing(mysteriousStranger)
        await powerChallenge.setTimeout(0)
      })

      it('should allow the applicant to withdraw once', async () => {
        const applicantEtherStartingBalance = await web3.eth.getBalance(user1)
        let tx = await registry.withdrawFromChallenge(listingHash, { from: user1 })
        const applicantEtherFinishingBalance = await web3.eth.getBalance(user1)

        const initialBalancePlusDeposit = applicantEtherStartingBalance.add(rewardWei)
        const finalBalanceWithGas = applicantEtherFinishingBalance.add(new BN(tx.receipt.gasUsed))

        debug(`initialBalancePlusDeposit: ${initialBalancePlusDeposit.toString()}`)
        debug(`finalBalanceWithGas: ${finalBalanceWithGas.toString()}`)

        assert.ok(
          isApproxEqualBN(
            initialBalancePlusDeposit,
            finalBalanceWithGas
          ),
          'Applicant withdrew the fee'
        )
        tx = await registry.withdrawFromChallenge(listingHash, { from: user1 })
        const applicantEtherSecondBalance = await web3.eth.getBalance(user1)

        assert.ok(
          isApproxEqualBN(
            applicantEtherSecondBalance,
            applicantEtherFinishingBalance.sub(new BN(tx.receipt.gasUsed))
          ),
          'applicant ether balance has not changed'
        )

        assert.equal(
          await registry.listingsLength(),
          1,
          'record is now listed'
        )
      })

      it('should allow the approver to withdraw', async () => {
        const strangerStartingBalance = await workToken.balanceOf(mysteriousStranger)
        const applicantStartingBalance = await workToken.balanceOf(user1)

        await registry.withdrawFromChallenge(listingHash, { from: mysteriousStranger })

        const strangerFinishingBalance = await workToken.balanceOf(mysteriousStranger)
        const applicantFinishingBalance = await workToken.balanceOf(user1)

        const approverDeposit = depositAndJobAmount
        const total = listingStake.add(new BN(jobStake)).add(approverDeposit)
        const approveTotal = listingStake.add(approverDeposit)
        const approverShare = approverDeposit.mul(total).div(approveTotal)
        const applicantShare = listingStake.mul(total).div(approveTotal).sub(listingStake)

        // applicant: 10
        // verifier: 20
        // stranger: 60
        // total: 90

        // stranger: 60/70 * 90 = 77.14285714285714
        // applicant: 10/70 * 90 = 12.857142857142856

        assert.ok(
          isApproxEqualBN(
            approverShare.toString(),
            strangerFinishingBalance.sub(strangerStartingBalance).toString(),
            1
          ),
          'the approver has taken their full share'
        )

        assert.ok(
          isApproxEqualBN(
            applicantShare.toString(),
            applicantFinishingBalance.sub(applicantStartingBalance).toString(),
            1
          ),
          `the applicant has taken their share less the listing deposit: ${applicantShare.toString()}, ${applicantFinishingBalance.sub(applicantStartingBalance).toString()}`
        )

        assert.equal(
          listingStake.toString(),
          await workToken.balanceOf(registry.address),
          'registry still has the listing deposit'
        )
      })

      it('should do nothing for the verifier', async () => {
        const verifierEtherStartingBalance = await web3.eth.getBalance(verifier)
        const tx = await registry.withdrawFromChallenge(listingHash, { from: verifier })
        debug(tx)
        const verifierEtherFinishingBalance = await web3.eth.getBalance(verifier)

        debug(`${verifierEtherStartingBalance.sub(verifierEtherFinishingBalance).toString()}`)

        assert.ok(
          isApproxEqualBN(verifierEtherStartingBalance, verifierEtherFinishingBalance),
          'Verifier withdrew nothing'
        )
      })

      it('should do nothing for anyone else', async () => {
        const etherStartingBalance = await web3.eth.getBalance(owner)
        await registry.withdrawFromChallenge(listingHash, { from: owner })
        const etherFinishingBalance = await web3.eth.getBalance(owner)

        debug(`${etherStartingBalance.sub(etherFinishingBalance).toString()}`)

        // still exists because the power challenge state isn't complete
        assert.equal(
          true,
          await powerChallenge.challengeExists(listingHash),
          "challenge doesn't exist"
        )

        assert.ok(
          isApproxEqualBN(etherStartingBalance, etherFinishingBalance),
          'Owner withdrew nothing'
        )
      })
    })

    context('when challenge succeeds', () => {
      beforeEach(async () => {
        await powerChallenge.setTimeout(0)
      })

      it('should remove the challenge and listing', async () => {
        const verifierStartingBalance = await workToken.balanceOf(verifier)

        assert.equal(
          true,
          await powerChallenge.challengeExists(listingHash),
          "challenge doesn't exist"
        )

        await registry.withdrawFromChallenge(listingHash, { from: verifier })
        const verifierFinishingBalance = await workToken.balanceOf(verifier)

        assert.ok(
          await coordinationGame.removed(listingHash),
          'coordination game was removed'
        )

        assert.equal(
          depositAndJobAmount.toString(),
          verifierFinishingBalance.sub(verifierStartingBalance).toString(),
          'verifier has taken all the dough'
        )

        assert.equal(
          0,
          await registry.listingsLength(),
          'the listing has been removed'
        )

        assert.equal(
          false,
          await powerChallenge.challengeExists(listingHash),
          'challenge exists'
        )
      })
    })
  })

  describe('withdrawListing()', () => {
    beforeEach(async () => {
      await registry.applicantWonCoordinationGame(listingHash, user1, listingStake.toString(), secret, hint)
    })

    it('should allow an applicant to withdraw their listing', async () => {
      const user1StartingBalance = await workToken.balanceOf(user1)

      const tx = await registry.withdrawListing(listingHash, { from: user1 })

      debug(`withdrawListing() tx.logs: `, tx.logs)

      const ListingWithdrawn = tx.logs[0]
      assert.equal(ListingWithdrawn.event, 'ListingWithdrawn')

      expect(ListingWithdrawn.args).to.deep.equal({
        owner: user1,
        listingHash: listingHash
      })

      const user1EndingBalance = await workToken.balanceOf(user1)
      assert.equal(user1EndingBalance.toNumber(), user1StartingBalance.plus(listingStake).toNumber(), 'tokens were refunded')

      const listing = await registry.listings(listingHash)

      assert.equal(await registry.listingsLength(), 0, 'there are no listings')
      assert.equal(listing[0].toString(), '0x0000000000000000000000000000000000000000', 'there is no owner')
      assert.equal(listing[1].toString(), '0', 'there is no deposit')
    })
  })

  describe('challenge()', () => {
    beforeEach(async () => {
      await registry.applicantWonCoordinationGame(listingHash, user1, listingStake.toString(), secret, hint)
    })

    it('should allow someone to challenge that listing', async () => {
      const strangerStartingBalance = await workToken.balanceOf(mysteriousStranger)
      const firstChallenge = new BN(web3.toWei('30', 'ether'))
      await workToken.approve(registry.address, firstChallenge.toString(), { from: mysteriousStranger })
      debug(`starting challenge....`)
      await registry.challenge(listingHash, { from: mysteriousStranger })

      assert.equal(await powerChallenge.isChallenging(listingHash), true, 'listing is being challenged')

      await powerChallenge.setTimeout(0)

      await registry.withdrawFromChallenge(listingHash, { from: mysteriousStranger })

      const strangerFinishingBalance = await workToken.balanceOf(mysteriousStranger)

      assert.equal(
        strangerFinishingBalance.toString(),
        strangerStartingBalance.add(listingStake).toString(),
        'challenger has received stake'
      )
    })

    it('should allow multiple people to withdraw from a challenge', async () => {
      const strangerStartingBalance = await workToken.balanceOf(mysteriousStranger)
      const stranger2StartingBalance = await workToken.balanceOf(stranger2)

      debug(`starting first challenge...`)

      const firstChallenge = new BN(web3.toWei('20', 'ether'))
      await workToken.approve(registry.address, firstChallenge.toString(), { from: mysteriousStranger })
      await registry.challenge(listingHash, { from: mysteriousStranger })

      debug(`starting first approval...`)

      const firstApproval = new BN(web3.toWei('30', 'ether'))
      assert.equal(firstApproval.toString(), (await powerChallenge.nextDepositAmount(listingHash)).toString())
      assert.equal(false, await powerChallenge.isTimedOut(listingHash))
      assert.equal(true, await powerChallenge.isChallenging(listingHash))
      await workToken.approve(powerChallenge.address, firstApproval.toString(), { from: user1 })
      await powerChallenge.approve(listingHash, { from: user1 })

      const secondChallenge = firstApproval.mul(new BN(2))
      assert.equal(secondChallenge.toString(), (await powerChallenge.nextDepositAmount(listingHash)).toString())
      assert.equal(false, await powerChallenge.isTimedOut(listingHash))
      assert.equal(true, await powerChallenge.isChallenging(listingHash))

      debug(`starting second challenge...`)

      await workToken.approve(powerChallenge.address, secondChallenge.toString(), { from: stranger2 })
      await powerChallenge.challenge(listingHash, { from: stranger2 })
      await powerChallenge.setTimeout(0)

      debug(`starting withdrawal from challenge...`)

      const listingsCount = await registry.listingsLength()

      assert.equal(await powerChallenge.isTimedOut(listingHash), true)
      await registry.withdrawFromChallenge(listingHash, { from: mysteriousStranger })

      assert.equal((await registry.listingsLength()).toString(), listingsCount.sub(1).toString(), 'listing is no longer active')

      await registry.withdrawFromChallenge(listingHash, { from: stranger2 })

      const strangerFinishingBalance = await workToken.balanceOf(mysteriousStranger)
      const stranger2FinishingBalance = await workToken.balanceOf(stranger2)

      assert.equal(
        strangerFinishingBalance.toString(),
        strangerStartingBalance.add(web3.toWei('10', 'ether')).toString(),
        'first challenger has received stake'
      )

      assert.equal(
        stranger2FinishingBalance.toString(),
        stranger2StartingBalance.add(web3.toWei('30', 'ether')).toString(),
        'second challenger has received stake'
      )
    })
  })

  describe('totalChallengeReward()', () => {
    beforeEach(async () => {
      await registry.applicantLostCoordinationGame(
        listingHash, user1, listingStake.toString(), secret, hint, rewardWei, verifier, jobStake,
        { from: owner, value: rewardWei }
      )
      await workToken.mint(user1, web3.toWei('10000', 'ether'))
      await workToken.mint(verifier, web3.toWei('10000', 'ether'))
      await workToken.mint(user2, web3.toWei('10000', 'ether'))
    })

    it('should calculate the rewards', async () => {
      let initialDeposit = listingStake.add(new BN(jobStake)) // first approve and challenge

      debug('approveListing(user1)...')
      let secondApproveDeposit = await nextDepositAmount()
      await approveListing(user1, secondApproveDeposit)
      debug('challengeListing(mysteriousStranger)...')
      let secondChallengeDeposit = await nextDepositAmount()
      await challengeListing(mysteriousStranger, secondChallengeDeposit)
      debug('approveListing(user2)...')
      let thirdApproveDeposit = await nextDepositAmount()
      await approveListing(user2, thirdApproveDeposit)
      debug('powerChallenge.setTimeout(0)...')
      await powerChallenge.setTimeout(0)

      debug(`complete: ${typeof secondApproveDeposit}, ${secondApproveDeposit.toString()}`)

      let approveTotal = listingStake.add(secondApproveDeposit).add(thirdApproveDeposit)
      let total = initialDeposit.add(secondApproveDeposit).add(secondChallengeDeposit).add(thirdApproveDeposit)

      assert.equal(
        total.mul(listingStake.add(secondApproveDeposit)).div(approveTotal).sub(listingStake).toString(),
        (await registry.totalChallengeReward(listingHash, user1)).toString(),
        'The listing owner gets their share less the deposit'
      )

      assert.equal(
        (await registry.totalChallengeReward(listingHash, user2)).toString(),
        total.mul(thirdApproveDeposit).div(approveTotal).toString(),
        'The second challenger gets their full share'
      )

      assert.equal(
        (await registry.totalChallengeReward(listingHash, mysteriousStranger)).toString(),
        '0',
        'The challenger gets nothing'
      )
    })
  })

  describe('listingExists()', () => {
    it('should exist', async () => {
      await registry.applicantWonCoordinationGame(listingHash, user1, listingStake.toString(), secret, hint)
      const exists = await registry.listingExists(listingHash)
      assert.equal(exists, true, 'does not exist')
    })

    it('should not exist', async () => {
      // Doesn't exist yet
      const exists = await registry.listingExists(listingHash)
      assert.equal(exists, false, 'does exist')
    })
  })

})
