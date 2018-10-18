const debug = require('debug')('mineBlock.js')

module.exports = function() {
  debug(`mining block`)

  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_mine',
      params: []
    }, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  })
}
