const TILRegistry = artifacts.require('TILRegistry.sol')
const TILRoles = artifacts.require('TILRoles.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const PowerChallenge = artifacts.require('PowerChallenge.sol')
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
  const [owner, user1, user2, verifier, mysteriousStranger] = accounts

  const listingStake = web3.toWei('10', 'ether')
  const listingHash = '0x1000000000000000000000000000000000000000000000000000000000000000'

  let registry,
      workToken,
      work,
      roles

  const requiredStake = web3.toWei('20', 'ether')
  const jobStake = web3.toWei('20', 'ether')
  const minimumBalanceToWork = web3.toWei('15', 'ether')
  const jobManagerBalance = web3.toWei('1000', 'ether')
  const applicantDepositEther = web3.toWei('5', 'ether')
  const depositAndJobAmount = new BN(listingStake).add(new BN(jobStake))

  before(async () => {
    workToken = await WorkToken.new()
    await workToken.init(owner)
    roles = await TILRoles.new()
    await roles.init(owner)
    await roles.setRole(owner, 1, true) // owner is the job manager
    work = await Work.new()
    await workToken.mint(mysteriousStranger, web3.toWei('10000', 'ether'))
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
    registry = await TILRegistry.new()
    await registry.initialize(workToken.address, roles.address, work.address, powerChallenge.address)
    await workToken.mint(owner, depositAndJobAmount.toString())
    await workToken.approve(registry.address, depositAndJobAmount.toString())
  })

  async function getListing(listingHash) {
    return mapToListing(await registry.listings(listingHash))
  }

  async function getChallenge(listingHash) {
    return mapToChallenge(await powerChallenge.challenges(listingHash))
  }

  describe('applicantWonCoordinationGame()', () => {
    it('should only be called by the job manager', async () => {
      expectThrow(async () => {
        await registry.applicantWonCoordinationGame(listingHash, user1, listingStake, { from: user2 })
      })
    })

    context('on success', () => {
      let registryTokenBalance

      beforeEach(async () => {
        registryTokenBalance = await workToken.balanceOf(registry.address)
        await registry.applicantWonCoordinationGame(listingHash, user1, listingStake)
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
        await registry.applicantLostCoordinationGame(listingHash, user1, listingStake, 0, 0, 0, { from: user2 })
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
          listingHash, user1, listingStake, applicantDepositEther, verifier, jobStake, {
            from: owner,
            value: applicantDepositEther
          }
        )
      })

      it('should add an applicant', async () => {
        let registryFinalTokenBalance = await workToken.balanceOf(registry.address)
        let registryFinalEtherBalance = await web3.eth.getBalance(registry.address)
        let powerChallengeFinalTokenBalance = await workToken.balanceOf(powerChallenge.address)
        let powerChallengeFinalEtherBalance = await web3.eth.getBalance(powerChallenge.address)

        assert.ok(
          isApproxEqualBN(registryFinalEtherBalance, registryEtherBalance.add(applicantDepositEther)),
          'application fee ether was moved into the registry'
        )

        assert.equal(
          powerChallengeFinalTokenBalance.toString(), powerChallengeTokenBalance.add(depositAndJobAmount).toString(),
          'applicant deposit and work stake were moved into the power challenge'
        )

        const newListing = await getListing(listingHash)

        debug(`applicantLostCoordinationGame(): ${newListing}`)

        assert.equal(await registry.listingsLength(), 1) // new registry listing
        assert.equal(await registry.listingAt(0), listingHash) // exists
        assert.equal(newListing.owner, user1, 'owner is applicant') // owned by applicant
        assert.equal(newListing.deposit, listingStake, 'deposit is set')

        const challenge = await getChallenge(listingHash)

        assert.equal(await powerChallenge.notStarted(listingHash), false, 'challenge has started')
        assert.equal(challenge.round, 1, 'second round is complete')
        assert.equal(
          challenge.challengeTotal.add(challenge.approveTotal).toString(),
          depositAndJobAmount.toString(), 'total challenge tokens are both deposits')
      })
    })
  })

  describe('withdrawFromChallenge()', () => {
    beforeEach(async () => {
      await registry.applicantLostCoordinationGame(
        listingHash, user1, listingStake, applicantDepositEther, verifier, jobStake,
        { from: owner, value: applicantDepositEther }
      )
    })

    context('when challenge failed', () => {
      beforeEach(async () => {
        await workToken.approve(
          powerChallenge.address, await powerChallenge.nextDepositAmount(listingHash), { from: mysteriousStranger }
        )
        await powerChallenge.approve(listingHash, { from: mysteriousStranger })
        await powerChallenge.setTimeout(0)
      })

      it('should allow the applicant to withdraw once', async () => {
        const applicantEtherStartingBalance = await web3.eth.getBalance(user1)
        let tx = await registry.withdrawFromChallenge(listingHash, { from: user1 })
        const applicantEtherFinishingBalance = await web3.eth.getBalance(user1)

        const initialBalancePlusDeposit = applicantEtherStartingBalance.add(applicantDepositEther)
        const finalBalanceWithGas = applicantEtherFinishingBalance.add(new BN(tx.receipt.gasUsed))

        const diff = initialBalancePlusDeposit.sub(finalBalanceWithGas)
        const maxDiff = web3.toWei('0.1', 'ether')
        debug(`initialBalancePlusDeposit: ${initialBalancePlusDeposit.toString()}`)
        debug(`finalBalanceWithGas: ${finalBalanceWithGas.toString()}`)
        debug(`ETHER: ${web3.fromWei(diff, 'ether')}`)
        debug(`MAX DIFF: ${maxDiff.toString()}`)

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
            applicantEtherFinishingBalance.add(new BN(tx.receipt.gasUsed))
          ),
          'balance has not changed'
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

        assert.ok(
          isApproxEqualBN(etherStartingBalance, etherFinishingBalance),
          'Owner withdrew nothing'
        )
      })
    })
  })

  describe('withdrawListing()', () => {
    beforeEach(async () => {
      await registry.applicantWonCoordinationGame(listingHash, user1, listingStake)
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
})
