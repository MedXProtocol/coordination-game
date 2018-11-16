const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const TILRoles = artifacts.require('TILRoles')
const execAdmin = require('./support/execAdmin')
const ownerAccount = require('./support/ownerAccount')

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    const requiredStake = web3.toWei('1000', 'ether') // to be a verifier
    const jobStake = web3.toWei('10', 'ether') // verifiers stake held during a verification
    const minimumBalanceToWork = web3.toWei('500', 'ether')

    await WorkToken.deployed()
    await TILRoles.deployed()

    execAdmin(`zos create Work --init init --args ${ownerAccount(accounts)},${WorkToken.address},${requiredStake.toString()},${jobStake.toString()},${minimumBalanceToWork.toString()},${TILRoles.address}`, networkName, accounts)
  })
};
