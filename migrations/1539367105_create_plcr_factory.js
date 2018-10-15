/* global artifacts */

const AttributeStore = artifacts.require('attrstore/AttributeStore.sol')
const DLL = artifacts.require('dll/DLL.sol')
const PLCRFactory = artifacts.require('PLCRFactory.sol')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  deployer.link(DLL, PLCRFactory)
  deployer.link(AttributeStore, PLCRFactory)
  return deployer.deploy(PLCRFactory).then(instance => {
    if (!tdr.isDryRunNetworkName(networkName)) {
      tdr.appendInstance(instance)
    }
  })
};
