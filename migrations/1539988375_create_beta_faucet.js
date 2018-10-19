const BetaFaucet = artifacts.require("./BetaFaucet.sol")
const WorkToken = artifacts.require("./WorkToken.sol")
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  deployer.deploy(BetaFaucet).then(async (betaFaucetInstance) => {
    const workToken = await WorkToken.deployed()
    betaFaucetInstance.init(workToken.address)

    if (!tdr.isDryRunNetworkName(networkName)) {
      await tdr.appendInstance(betaFaucetInstance)
    }
  })
}
