const shell = require('shelljs')
const debug = require('debug')('execAdmin.js')

module.exports = function (zosCommand, networkName, accounts) {
  let adminNetworkName = networkName + 'Admin'
  let from = ""
  if (networkName === 'local' || networkName === 'development') {
    adminNetworkName = networkName
    from = `--from ${accounts[1]}`
  }
  const cmd = `${zosCommand} --network ${adminNetworkName}`
  debug(cmd)
  var result = shell.exec(`${zosCommand} --network ${adminNetworkName} ${from}`)
  if (result.code !== 0) {
    throw new Error(result)
  }
  return result
}
