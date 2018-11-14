const BetaFaucet = artifacts.require("./BetaFaucet.sol")
const WorkToken = artifacts.require("./WorkToken.sol")
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    const workToken = await WorkToken.deployed()
    await deployer.deploy(BetaFaucet, workToken.address).then(async (betaFaucetInstance) => {
      if (!tdr.isDryRunNetworkName(networkName)) {
        await tdr.appendInstance(betaFaucetInstance)
      }
    })
  })
}
