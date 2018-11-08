const CoordinationGameFactory = artifacts.require('CoordinationGameFactory.sol')
const Work = artifacts.require('Work.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const tdr = require('truffle-deploy-registry')
const createCoordinationGame = require('./support/createCoordinationGame')

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    const registryEntry = await tdr.findLastByContractName(deployer.network_id, 'TILRegistry')
    const coordinationGameFactory = await CoordinationGameFactory.deployed()
    const work = await Work.deployed()
    const workToken = await WorkToken.deployed()
    const applicationStakeAmount = web3.toWei('20', 'ether') // the cost to apply

    const addresses = await createCoordinationGame(
      coordinationGameFactory,
      work.address,
      registryEntry.address,
      accounts[0],
      applicationStakeAmount
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
