const EtherPriceFeed = artifacts.require('EtherPriceFeed.sol')
const CoordinationGameFactory = artifacts.require('CoordinationGameFactory.sol')
const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const tdr = require('truffle-deploy-registry')
const createCoordinationGame = require('./support/createCoordinationGame')
const promisify = require('../test/helpers/promisify')

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    let etherPriceFeed
    const registryEntry = await tdr.findLastByContractName(deployer.network_id, 'TILRegistry')
    const coordinationGameFactory = await CoordinationGameFactory.deployed()
    const work = await Work.deployed()
    const workToken = await WorkToken.deployed()
    const applicationStakeAmount = web3.toWei('20', 'ether') // the cost to apply
    const baseApplicationFeeUsdWei = web3.toWei('25', 'ether') // the cost to apply in Eth

    const networkId = await promisify(cb => web3.version.getNetwork(cb))
    switch(networkId) {
      case '1': // mainnet
        etherPriceFeed = await EtherPriceFeed.at('0x729D19f657BD0614b4985Cf1D82531c67569197B')
      case '42': // kovan
        // no-op
        etherPriceFeed = await EtherPriceFeed.at('0xa944bd4b25c9f186a846fd5668941aa3d3b8425f')
      default: // localhost / ropsten / rinkeby
        etherPriceFeed = await EtherPriceFeed.deployed()
    }

    const addresses = await createCoordinationGame(
      coordinationGameFactory,
      etherPriceFeed.address,
      work.address,
      registryEntry.address,
      accounts[0],
      applicationStakeAmount,
      baseApplicationFeeUsdWei
    )

    if (!tdr.isDryRunNetworkName(networkName)) {
      await tdr.append(deployer.network_id, {
        contractName: 'CoordinationGame',
        address: addresses.coordinationGameAddress,
        transactionHash: addresses.transactionHash
      })
    }
  })
}
