const CoordinationGame = artifacts.require('CoordinationGame.sol')
const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const TILRoles = artifacts.require('TILRoles.sol')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    const coordinationGame = await CoordinationGame.deployed()
    const roles = await TILRoles.deployed()
    await roles.setRole(coordinationGame.address, 1, true)
  })
}
