const WorkToken = artifacts.require('WorkToken')
const Work = artifacts.require('Work')

const debug = require('debug')('bootstrap-verifiers.js')

async function setup() {
  const wt = await WorkToken.deployed()
  const w = await Work.deployed()

  await wt.mint('0x061f4af068d28a2ead064c91388d4b25598d6d35', 50000000000000000000000)
  await wt.mint('0x8a23c3556fa6a8fd38c86597acfd0151ac62861c', 50000000000000000000000)
  await wt.mint('0x5de6eb9f504dc50d33357b61364660db064b623d', 50000000000000000000000)
  await wt.mint('0x376de69d2a7130a7d41d052129e8b25335fc1c6e', 50000000000000000000000)
  await wt.mint('0x681bd7f52d97d5b352bb6531ff9cda928bbd3d97', 50000000000000000000000)

  var address = '0x061f4af068d28a2ead064c91388d4b25598d6d35'
  await wt.approve(w.address, 1000000000000000000000, { from: address })
  await w.depositStake({ from: address })
  debug(`Staked ${address}`)

  var address = '0x8a23c3556fa6a8fd38c86597acfd0151ac62861c'
  await wt.approve(w.address, 1000000000000000000000, { from: address })
  await w.depositStake({ from: address })
  debug(`Staked ${address}`)

  var address = '0x5de6eb9f504dc50d33357b61364660db064b623d'
  await wt.approve(w.address, 1000000000000000000000, { from: address })
  await w.depositStake({ from: address })
  debug(`Staked ${address}`)

  var address = '0x376de69d2a7130a7d41d052129e8b25335fc1c6e'
  await wt.approve(w.address, 1000000000000000000000, { from: address })
  await w.depositStake({ from: address })
  debug(`Staked ${address}`)

  var address = '0x681bd7f52d97d5b352bb6531ff9cda928bbd3d97'
  await wt.approve(w.address, 1000000000000000000000, { from: address })
  await w.depositStake({ from: address })
  debug(`Staked ${address}`)

  debug(`Done!`)
}

module.exports = function(callback) {
  console.log('Starting bootstrap verifiers script...')
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
