const WorkToken = artifacts.require('WorkToken.sol')

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    const workTokenInstance = await WorkToken.deployed()
    await workTokenInstance.addMinter(accounts[0])
  })
}
