const shell = require('shelljs')
const debug = require('debug')('execAdmin.js')

module.exports = function (zosCommand, networkName, accounts) {
  let adminNetworkName = networkName + 'Admin'
  const cmd = `${zosCommand} --network ${adminNetworkName}`
  debug(cmd)
  var result = shell.exec(`${zosCommand} --network ${adminNetworkName}`)
  if (result.code !== 0) {
    throw new Error(result)
  }
  return result
}
