const execAdmin = require('./support/execAdmin')
const ownerAccount = require('./support/ownerAccount')

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    execAdmin(`zos create WorkToken --init init --args ${ownerAccount(accounts)}`, networkName, accounts)
  })
};
