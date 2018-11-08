const TILRegistryFactory = artifacts.require('TILRegistryFactory.sol')
const TILRegistry = artifacts.require('TILRegistry.sol')
const Parameterizer = artifacts.require('Parameterizer.sol')
const TILRoles = artifacts.require('TILRoles.sol')
const tdr = require('truffle-deploy-registry')
const abiDecoder = require('abi-decoder')
const createTILRegistry = require('./support/createTILRegistry')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    const pEntry = await tdr.findLastByContractName(deployer.network_id, 'Parameterizer')
    const parameterizer = await Parameterizer.at(pEntry.address)
    const tilRegistryFactory = await TILRegistryFactory.deployed()
    const roles = await TILRoles.deployed()
    const name = "MedX Registry"

    const addresses = await createTILRegistry(
      tilRegistryFactory,
      parameterizer.address,
      name,
      roles.address
    )
    const tilRegistryInstance = await TILRegistry.at(addresses.tilRegistryAddress)

    if (!tdr.isDryRunNetworkName(networkName)) {
      await tdr.append(deployer.network_id, {
        contractName: 'TILRegistry',
        address: addresses.tilRegistryAddress,
        transactionHash: addresses.transactionHash
      })
    }
  })
};
