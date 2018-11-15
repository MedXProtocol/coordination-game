const promisify = require('../../test/helpers/promisify')

module.exports = async function (artifacts, web3) {
  const EtherPriceFeed = artifacts.require('EtherPriceFeed')
  const networkId = await promisify(cb => web3.version.getNetwork(cb))
  switch(networkId) {
    case '1': // mainnet
      return '0x729D19f657BD0614b4985Cf1D82531c67569197B'
    case '42': // kovan
      return '0xa944bd4b25c9f186a846fd5668941aa3d3b8425f'
    default: // localhost / ropsten / rinkeby
      const instance = await EtherPriceFeed.deployed()
      return instance.address
  }
}
