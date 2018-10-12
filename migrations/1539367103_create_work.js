const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    await WorkToken.deployed()
    return deployer.deploy(Work, WorkToken.address, web3.utils.toWei('1000', 'ether')).then(instance => {
      if (!tdr.isDryRunNetworkName(networkName)) {
        tdr.appendInstance(instance)
      }
    })
  })
};
