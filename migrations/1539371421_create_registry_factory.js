const CoordinationGameFactory = artifacts.require('CoordinationGameFactory.sol')
const TILRegistryFactory = artifacts.require('TILRegistryFactory.sol')
const ParameterizerFactory = artifacts.require('ParameterizerFactory.sol')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    const parameterizerFactory = await ParameterizerFactory.deployed()
    const coordinationGameFactory = await CoordinationGameFactory.deployed()

    return deployer.deploy(TILRegistryFactory, coordinationGameFactory.address, parameterizerFactory.address).then(instance => {
      if (!tdr.isDryRunNetworkName(networkName)) {
        return tdr.appendInstance(instance)
      }
    })
  })
};
