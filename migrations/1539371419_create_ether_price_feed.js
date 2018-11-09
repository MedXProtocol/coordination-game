const EtherPriceFeed = artifacts.require('./EtherPriceFeed.sol')
const tdr = require('truffle-deploy-registry')
const promisify = require('../test/helpers/promisify')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    const networkId = await promisify(cb => web3.version.getNetwork(cb))

    switch(networkId) {
      case '1': // mainnet
        // no-op
        // return registry.register('0x729D19f657BD0614b4985Cf1D82531c67569197B')
      case '42': // kovan
        // no-op
        // return registry.register('0xa944bd4b25c9f186a846fd5668941aa3d3b8425f')
      default: // localhost / ropsten / rinkeby
        return deployer.deploy(EtherPriceFeed).then(async (instance) => {
          if (!tdr.isDryRunNetworkName(networkName)) {
            tdr.appendInstance(instance)

            await(instance.set(web3.toWei('210.83', 'ether')))
          }
        })
    }
  })
};
