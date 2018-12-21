const TILRoles = artifacts.require('TILRoles.sol')
const TILRegistry = artifacts.require('TILRegistry.sol')

module.exports = function(deployer) {
  deployer.then(async () => {
    const registry = await TILRegistry.deployed()
    const roles = await TILRoles.deployed()
    await roles.setRole(registry.address, 2, true)
  })
};
