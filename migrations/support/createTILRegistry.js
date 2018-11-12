const abiDecoder = require('abi-decoder')

module.exports = async function (
  tilRegistryFactory,
  parameterizerAddress,
  name,
  roles
) {
  let tilRegistryAddress, transactionHash

  await tilRegistryFactory.createTILRegistryWithParameterizer(
    parameterizerAddress,
    name,
    roles
  ).then(async (transactionReceipt) => {
    const { tx, receipt } = transactionReceipt
    transactionHash = tx
    abiDecoder.addABI(tilRegistryFactory.abi)

    const decoded = abiDecoder.decodeLogs(receipt.logs)

    const TILRegistryCreated = decoded[0]
    tilRegistryAddress =
      TILRegistryCreated.events.find(arg => arg.name === 'tilRegistry').value
  })

  return {
    tilRegistryAddress,
    transactionHash
  }
}
