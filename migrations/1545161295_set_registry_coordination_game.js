const CoordinationGame = artifacts.require('CoordinationGame.sol')
const TILRegistry = artifacts.require('TILRegistry.sol')

module.exports = function(deployer) {
  deployer.then(async () => {
    const coordinationGame = await CoordinationGame.deployed()
    const registry = await TILRegistry.deployed()
    await registry.setCoordinationGame(coordinationGame.address)
  })
}
