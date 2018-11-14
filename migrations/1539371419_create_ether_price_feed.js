const promisify = require('../test/helpers/promisify')
const execAdmin = require('./support/execAdmin')
const ownerAccount = require('./support/ownerAccount')

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    const networkId = await promisify(cb => web3.version.getNetwork(cb))
    const value = web3.toWei('210.83', 'ether')
    if (networkId !== '1' && networkId !== '42') {
      execAdmin(`zos create EtherPriceFeed  --init init --args ${ownerAccount(accounts)},${value.toString()}`, networkName, accounts)
    }
  })
};
