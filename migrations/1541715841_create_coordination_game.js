const CoordinationGame = artifacts.require('CoordinationGame.sol')
const Work = artifacts.require('Work.sol')
const TILRegistry = artifacts.require('TILRegistry.sol')
const tdr = require('truffle-deploy-registry')
const createCoordinationGame = require('./support/createCoordinationGame')
const promisify = require('../test/helpers/promisify')

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    const work = await Work.deployed()
    const registry = await TILRegistry.deployed()
    const applicationStakeAmount = web3.toWei('20', 'ether') // the cost to apply
    const baseApplicationFeeUsdWei = web3.toWei('25', 'ether') // the cost to apply in Eth
    const etherPriceFeed = await tdr.findLastByContractName(deployer.network_id, 'EtherPriceFeed')

    const instance = await deployer.deploy(CoordinationGame,
      etherPriceFeed.address,
      work.address,
      registry.address,
      applicationStakeAmount.toString(),
      baseApplicationFeeUsdWei.toString()
    )

    if (!tdr.isDryRunNetworkName(networkName)) {
      await tdr.appendInstance(instance)
    }
  })
}
