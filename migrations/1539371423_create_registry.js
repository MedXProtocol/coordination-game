const TILRegistry = artifacts.require('TILRegistry.sol')
const TILRoles = artifacts.require('TILRoles.sol')
const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const tdr = require('truffle-deploy-registry')
const abiDecoder = require('abi-decoder')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    const roles = await TILRoles.deployed()
    const work = await Work.deployed()
    const token = await WorkToken.deployed()
    const instance = await deployer.deploy(TILRegistry, token.address, roles.address, work.address)
    if (!tdr.isDryRunNetworkName(networkName)) {
      await tdr.appendInstance(instance)
    }
  })
};
