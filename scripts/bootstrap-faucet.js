const BetaFaucet = artifacts.require('BetaFaucet')
const WorkToken = artifacts.require('WorkToken')
const Work = artifacts.require('Work')

const debug = require('debug')('bootstrap.js')

async function setup() {
  const bf = await BetaFaucet.deployed()
  const wt = await WorkToken.deployed()

  await web3.eth.sendTransaction({ from: web3.eth.accounts[0], to: bf.address, value: web3.toWei(10, "ether") })

  await wt.mint(bf.address, 50000000000000000000000)
  debug(`Minted to BetaFaucet ${bf.address}`)
}

module.exports = function(callback) {
  console.log('Starting bootstrap script...')
  setup()
    .catch(error => console.error(error))
    .finally(callback)
  console.log('Done!')
}
