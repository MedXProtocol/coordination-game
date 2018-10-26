const CoordinationGameFactory = artifacts.require('CoordinationGameFactory.sol')
const tdr = require('truffle-deploy-registry')
const abiDecoder = require('abi-decoder')

module.exports = function(deployer, networkName) {
  deployer.deploy(CoordinationGameFactory).then(async (coordinationGameFactoryInstance) => {
    if (!tdr.isDryRunNetworkName(networkName)) {
      await tdr.appendInstance(coordinationGameFactoryInstance)
    }
  })
};
