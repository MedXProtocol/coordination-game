const TILRegistry = artifacts.require('TILRegistry.sol')
const TILRoles = artifacts.require('TILRoles.sol')
const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')

const execAdmin = require('./support/execAdmin')
const ownerAccount = require('./support/ownerAccount')

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    const token = await WorkToken.deployed()
    const timeout = 60

    execAdmin(
      `zos create PowerChallenge --init init --args ${ownerAccount(accounts)},${token.address},${timeout}`,
      networkName,
      accounts
    )
  })
};
