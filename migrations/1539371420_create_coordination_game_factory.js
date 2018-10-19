const CoordinationGameFactory = artifacts.require('CoordinationGameFactory.sol')
const Work = artifacts.require('Work.sol')
const tdr = require('truffle-deploy-registry')
const abiDecoder = require('abi-decoder')

module.exports = function(deployer, networkName) {
  deployer.deploy(CoordinationGameFactory).then(async (coordinationGameFactoryInstance) => {
    const work = await Work.deployed()
    work.setJobManager(coordinationGameFactoryInstance.address)

    if (!tdr.isDryRunNetworkName(networkName)) {
      await tdr.appendInstance(coordinationGameFactoryInstance)
    }
  })
};
