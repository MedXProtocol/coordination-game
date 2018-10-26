const TILRegistryFactory = artifacts.require('TILRegistryFactory.sol')
const TILRegistry = artifacts.require('TILRegistry.sol')
const Parameterizer = artifacts.require('Parameterizer.sol')
const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const tdr = require('truffle-deploy-registry')
const abiDecoder = require('abi-decoder')
const createTILRegistry = require('./support/createTILRegistry')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    const pEntry = await tdr.findLastByContractName(deployer.network_id, 'Parameterizer')
    const parameterizer = await Parameterizer.at(pEntry.address)
    const work = await Work.deployed()
    const workToken = await WorkToken.deployed()
    const tilRegistryFactory = await TILRegistryFactory.deployed()
    const name = "MedX Registry"

    const addresses = await createTILRegistry(
      tilRegistryFactory,
      parameterizer.address,
      work.address,
      name,
      web3.toWei('20', 'ether') // the cost to apply
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
