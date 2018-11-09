const CoordinationGame = artifacts.require('CoordinationGame.sol')
const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const TILRoles = artifacts.require('TILRoles.sol')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    const coordinationGameEntry = await tdr.findLastByContractName(deployer.network_id, 'CoordinationGame')

    const roles = await TILRoles.deployed()
    await roles.setRole(coordinationGameEntry.address, 1, true)
  })
}
