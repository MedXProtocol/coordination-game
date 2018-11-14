const BetaFaucet = artifacts.require('BetaFaucet')
const WorkToken = artifacts.require('WorkToken')
const Work = artifacts.require('Work')

const debug = require('debug')('bootstrap-faucet.js')
const util = require('util')

async function setup() {
  const bf = await BetaFaucet.deployed()
  const wt = await WorkToken.deployed()

  const getAccounts = util.promisify(web3.eth.getAccounts)
  const accounts = await getAccounts()

  await new Promise((resolve, reject) => {
    web3.eth.sendTransaction({ from: accounts[0], to: bf.address, value: web3.toWei(10, "ether") }, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })

  await wt.mint(bf.address, 50000000000000000000000)
  debug(`Minted to BetaFaucet ${bf.address}`)
}

module.exports = function(callback) {
  console.log('Starting bootstrap faucet script...')
  setup()
    .catch(error => {
      console.error(error)
      callback()
    })
    .then(() => {
      console.log('Done!')
      callback()
    })
}
