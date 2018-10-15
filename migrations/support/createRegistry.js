const abiDecoder = require('abi-decoder')

module.exports = async function (registryFactory, parameterizerAddress, workAddress, name) {
  let registryAddress, coordinationGameAddress, transactionHash
  await registryFactory.createRegistry(parameterizerAddress, workAddress, name).then(async (transactionReceipt) => {
    const { tx, receipt } = transactionReceipt
    transactionHash = tx
    abiDecoder.addABI(registryFactory.abi)
    const decoded = abiDecoder.decodeLogs(receipt.logs)

    const NewRegistry = decoded[decoded.length - 2]
    registryAddress = NewRegistry.events.find(event => event.name === 'registry').value

    const NewCoordinationGame = decoded[decoded.length - 1]
    coordinationGameAddress = NewCoordinationGame.events.find(event => event.name === 'coordinationGame').value
  })
  return {
    registryAddress,
    coordinationGameAddress,
    transactionHash
  }
}
