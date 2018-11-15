const BetaFaucet = artifacts.require("./BetaFaucet.sol")
const WorkToken = artifacts.require("./WorkToken.sol")
const execAdmin = require('./support/execAdmin')
const ownerAccount = require('./support/ownerAccount')

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    const workToken = await WorkToken.deployed()
    execAdmin(`zos create BetaFaucet --init initialize --args ${workToken.address},${ownerAccount(accounts)}`, networkName, accounts)
  })
}
