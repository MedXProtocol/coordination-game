const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const Parameterizer = artifacts.require('Parameterizer')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    await WorkToken.deployed()
    return deployer.deploy(Work,
      WorkToken.address,
      web3.toWei('100', 'ether'),
      web3.toWei('10', 'ether')
    ).then(instance => {
      if (!tdr.isDryRunNetworkName(networkName)) {
        tdr.appendInstance(instance)
      }
    })
  })
};