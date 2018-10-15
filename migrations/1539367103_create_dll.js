/* global artifacts */

const DLL = artifacts.require('dll/DLL.sol')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  return deployer.deploy(DLL).then(instance => {
    if (!tdr.isDryRunNetworkName(networkName)) {
      tdr.appendInstance(instance)
    }
  })
};
