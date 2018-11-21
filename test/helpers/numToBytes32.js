const abi = require('ethereumjs-abi')

module.exports = function (num) {
  return '0x' + abi.rawEncode([ 'bytes32' ], [num]).toString('hex')
}
