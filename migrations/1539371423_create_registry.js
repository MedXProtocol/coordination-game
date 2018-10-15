const RegistryFactory = artifacts.require('RegistryFactory.sol')
const Registry = artifacts.require('Registry.sol')
const Parameterizer = artifacts.require('Parameterizer.sol')
const Work = artifacts.require('Work.sol')
const tdr = require('truffle-deploy-registry')
const abiDecoder = require('abi-decoder')
const createRegistry = require('./support/createRegistry')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    const pEntry = await tdr.findLastByContractName(deployer.network_id, 'Parameterizer')
    const parameterizer = await Parameterizer.at(pEntry.address)
    const work = await Work.deployed()
    const registryFactory = await RegistryFactory.deployed()
    const name = "MedX Registry"

    const addresses = await createRegistry(registryFactory, parameterizer.address, work.address, name)
    if (!tdr.isDryRunNetworkName(networkName)) {
      await tdr.append(deployer.network_id, {
        contractName: 'Registry',
        address: addresses.registryAddress,
        transactionHash: addresses.transactionHash
      })

      await tdr.append(deployer.network_id, {
        contractName: 'CoordinationGame',
        address: addresses.coordinationGameAddress,
        transactionHash: addresses.transactionHash
      })
    }
  })
};
