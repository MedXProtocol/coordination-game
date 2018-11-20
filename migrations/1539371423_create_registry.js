const TILRegistry = artifacts.require('TILRegistry.sol')
const TILRoles = artifacts.require('TILRoles.sol')
const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const PowerChallenge = artifacts.require('PowerChallenge.sol')

const execAdmin = require('./support/execAdmin')
const ownerAccount = require('./support/ownerAccount')

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    const roles = await TILRoles.deployed()
    const work = await Work.deployed()
    const token = await WorkToken.deployed()
    const powerChallenge = await PowerChallenge.deployed()

    execAdmin(
      `zos create TILRegistry --init initialize --args ${token.address},${roles.address},${work.address},${powerChallenge.address}`,
      networkName,
      accounts
    )
  })
};
