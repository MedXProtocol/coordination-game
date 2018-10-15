const RegistryFactory = artifacts.require('RegistryFactory.sol')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  deployer.deploy(RegistryFactory).then(instance => {
    if (!tdr.isDryRunNetworkName(networkName)) {
      return tdr.appendInstance(instance)
    }
  })
};
