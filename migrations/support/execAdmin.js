const shell = require('shelljs')

module.exports = function (zosCommand, networkName, accounts) {
  var result = shell.exec(`${zosCommand} --network ${networkName} --from ${accounts[1]}`)
  if (result.code !== 0) {
    throw new Error(result)
  }
  return result
}
