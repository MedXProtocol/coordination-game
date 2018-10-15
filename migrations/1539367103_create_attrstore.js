/* global artifacts */

const AttributeStore = artifacts.require('attrstore/AttributeStore.sol')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  return deployer.deploy(AttributeStore).then(instance => {
    if (!tdr.isDryRunNetworkName(networkName)) {
      tdr.appendInstance(instance)
    }
  })
};
