/* global artifacts */

const TILRoles = artifacts.require('TILRoles.sol')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  return deployer.deploy(TILRoles).then(instance => {
    if (!tdr.isDryRunNetworkName(networkName)) {
      tdr.appendInstance(instance)
    }
  })
};
