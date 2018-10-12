const ApplicationRegistry = artifacts.require('ApplicationRegistry.sol')
const Work = artifacts.require('Work.sol')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    await Work.deployed()
    return deployer.deploy(ApplicationRegistry, Work.address).then(instance => {
      if (!tdr.isDryRunNetworkName(networkName)) {
        tdr.appendInstance(instance)
      }
    })
  })
};
