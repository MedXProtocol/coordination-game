const Work = artifacts.require('Work.sol')
const TILRegistry = artifacts.require('TILRegistry.sol')
const etherPriceFeedAddress = require('./support/etherPriceFeedAddress')
const execAdmin = require('./support/execAdmin')
const ownerAccount = require('./support/ownerAccount')

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    const work = await Work.deployed()
    const registry = await TILRegistry.deployed()
    const applicationStakeAmount = web3.toWei('20', 'ether') // the cost to apply
    const baseApplicationFeeUsdWei = web3.toWei('25', 'ether') // the cost to apply in Eth
    const etherPriceFeed = await etherPriceFeedAddress(artifacts, web3)

    execAdmin(`zos create CoordinationGame --init init --args ${ownerAccount(accounts)},${etherPriceFeed},${work.address},${registry.address},${applicationStakeAmount.toString()},${baseApplicationFeeUsdWei.toString()}`, networkName, accounts)
  })
}
