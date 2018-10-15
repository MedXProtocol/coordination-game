const PLCRFactory = artifacts.require('PLCRFactory.sol')
const ParameterizerFactory = artifacts.require('ParameterizerFactory.sol')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    await PLCRFactory.deployed()
    return deployer.deploy(ParameterizerFactory, PLCRFactory.address).then(instance => {
      if (!tdr.isDryRunNetworkName(networkName)) {
        return tdr.appendInstance(instance)
      }
    })
  })
};
