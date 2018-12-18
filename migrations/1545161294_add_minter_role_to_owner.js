const TILRoles = artifacts.require('TILRoles.sol')
const ownerAccount = require('./support/ownerAccount')

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    const roles = await TILRoles.deployed()
    await roles.setRole(ownerAccount(accounts), 0, true)
  })
}
