const createProject = require('./helpers/createProject')
const expectThrow = require('./helpers/expectThrow')
const WorkToken = artifacts.require("./WorkToken.sol")
const BetaFaucet = artifacts.require('./BetaFaucet.sol')

contract('BetaFaucet', function (accounts) {
  const [owner, admin, recipient, recipient2, recipient3] = accounts

  let workTokenInstance, betaFaucetInstance

  let project

  before(async () => {
    // project = await createProject(accounts)
    workTokenInstance = await WorkToken.new()
    await workTokenInstance.initialize(owner) //project.createProxy(WorkToken, { initArgs: [owner] })
    betaFaucetInstance = await BetaFaucet.new()
    await betaFaucetInstance.initialize(workTokenInstance.address, owner) //project.createProxy(BetaFaucet, { initArgs: [workTokenInstance.address, owner] })
  })

  describe('withdrawEther()', () => {
    it('should work', async () => {
      await betaFaucetInstance.send(web3.toWei(20, "ether"))

      const ownerAddress = await betaFaucetInstance.owner.call()

      assert(await web3.eth.getBalance(betaFaucetInstance.address), web3.toWei(20, "ether"))
      assert(await web3.eth.getBalance(ownerAddress), 0)

      await betaFaucetInstance.withdrawEther()
      const ownerBalance = await web3.eth.getBalance(ownerAddress)

      // 1000000 is gas amount in wei
      assert(ownerBalance, web3.toWei(20, "ether") - 1000000)
    })
  })

  describe('sendEther()', () => {
    it('should work', async () => {
      await betaFaucetInstance.send(web3.toWei(20, "ether"))
      const recipientBalance = await web3.eth.getBalance(recipient)
      await betaFaucetInstance.sendEther(recipient, web3.toWei(0.2, "ether"))
      const newRecipientBalance = await web3.eth.getBalance(recipient)
      assert.equal(
        newRecipientBalance.toString(),
        recipientBalance.add(web3.toWei(0.2, "ether")).toString()
      )
    })

    it('should not allow double sends', async () => {
      await betaFaucetInstance.send(web3.toWei(6, "ether"))
      await betaFaucetInstance.sendEther(recipient2, web3.toWei(1, "ether"))
      await expectThrow(async () => {
        await betaFaucetInstance.sendEther(recipient2, web3.toWei(1, "ether"))
      })
    })

    it('should prevent an amount above the limit', async () => {
      await betaFaucetInstance.send(web3.toWei(6, "ether"))
      await expectThrow(async () => {
        await betaFaucetInstance.sendEther(recipient3, web3.toWei(30, "ether"))
      })
    })
  })

  describe('sendTEX()', () => {
    it('should work', async () => {
      workTokenInstance.mint(betaFaucetInstance.address, 3000000)
      const betaFaucetDelegateTEXBalance = await workTokenInstance.balanceOf(betaFaucetInstance.address)
      assert.equal(betaFaucetDelegateTEXBalance, 3000000)

      const recipientsTEXBalance = await workTokenInstance.balanceOf(recipient)
      assert.equal(recipientsTEXBalance, 0)

      await betaFaucetInstance.sendTEX(recipient, 15)
      const recipientsNewTEXBalance = await workTokenInstance.balanceOf(recipient)
      assert.equal(recipientsNewTEXBalance, 15)
    })

    it('should not allow double sends', async () => {
      await betaFaucetInstance.sendTEX(recipient2, 15)
      expectThrow(async () => {
        await betaFaucetInstance.sendTEX(recipient2, 15)
      })
    })
  })
})
