const CoordinationGame = artifacts.require('CoordinationGame.sol')
const EtherPriceFeed = artifacts.require('EtherPriceFeed.sol')
const TILRegistryFactory = artifacts.require('TILRegistryFactory.sol')
const TILRegistry = artifacts.require('TILRegistry.sol')
const Parameterizer = artifacts.require('Parameterizer.sol')
const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const tdr = require('truffle-deploy-registry')
const abiDecoder = require('abi-decoder')
const createTILRegistry = require('./support/createTILRegistry')
const promisify = require('../test/helpers/promisify')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    let etherPriceFeedContract

    const pEntry = await tdr.findLastByContractName(deployer.network_id, 'Parameterizer')
    const parameterizer = await Parameterizer.at(pEntry.address)
    const work = await Work.deployed()
    const workToken = await WorkToken.deployed()
    const tilRegistryFactory = await TILRegistryFactory.deployed()
    const name = "MedX Registry"

    const networkId = await promisify(cb => web3.version.getNetwork(cb))
    switch(networkId) {
      case '1': // mainnet
        etherPriceFeedContract = await EtherPriceFeed.at('0x729D19f657BD0614b4985Cf1D82531c67569197B')
      case '42': // kovan
        // no-op
        etherPriceFeedContract = await EtherPriceFeed.at('0xa944bd4b25c9f186a846fd5668941aa3d3b8425f')
      default: // localhost / ropsten / rinkeby
        etherPriceFeedContract = await EtherPriceFeed.deployed()
    }

    const applicationStakeAmount = web3.toWei('20', 'ether') // the cost to apply in tokens
    const baseApplicationFeeUsdWei = web3.toWei('25', 'ether') // the cost to apply in Eth

    const addresses = await createTILRegistry(
      tilRegistryFactory,
      parameterizer.address,
      etherPriceFeedContract.address,
      work.address,
      name,
      applicationStakeAmount,
      baseApplicationFeeUsdWei
    )

    const tilRegistryInstance = await TILRegistry.at(addresses.tilRegistryAddress)
    const coordinationGameAddress = await tilRegistryInstance.coordinationGame()

    console.log('')
    console.log('Setting jobManager in Work contract to: ' + coordinationGameAddress)
    console.log('Work contract owner is: ' + await work.owner())
    console.log('')

    await work.setJobManager(coordinationGameAddress)

    if (!tdr.isDryRunNetworkName(networkName)) {
      await tdr.append(deployer.network_id, {
        contractName: 'TILRegistry',
        address: addresses.tilRegistryAddress,
        transactionHash: addresses.transactionHash
      })

      await tdr.append(deployer.network_id, {
        contractName: 'CoordinationGame',
        address: coordinationGameAddress,
        transactionHash: addresses.transactionHash
      })
    }
  })
};
