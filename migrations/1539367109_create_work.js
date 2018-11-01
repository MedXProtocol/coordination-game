const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const Parameterizer = artifacts.require('Parameterizer')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    const requiredStake = web3.toWei('1000', 'ether') // to be a verifier
    const jobStake = web3.toWei('10', 'ether') // verifiers stake held during a verification

    await WorkToken.deployed()

    return deployer.deploy(
      Work,
      WorkToken.address,
      requiredStake,
      jobStake
    ).then(instance => {
      if (!tdr.isDryRunNetworkName(networkName)) {
        tdr.appendInstance(instance)
      }
    })
  })
};
