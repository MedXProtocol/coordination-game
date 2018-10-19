const WorkToken = artifacts.require('WorkToken.sol')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  deployer.deploy(WorkToken).then(instance => {
    if (!tdr.isDryRunNetworkName(networkName)) {
      tdr.appendInstance(instance)
    }
  })
};
