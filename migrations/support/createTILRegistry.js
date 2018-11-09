const abiDecoder = require('abi-decoder')

module.exports = async function (
  tilRegistryFactory,
  parameterizerAddress,
  etherPriceFeedAddress,
  workAddress,
  name,
  applicationStakeAmount,
  baseApplicationFeeUsdWei
) {
  let tilRegistryAddress, transactionHash

  await tilRegistryFactory.createTILRegistry(
    parameterizerAddress,
    etherPriceFeedAddress,
    workAddress,
    name,
    applicationStakeAmount,
    baseApplicationFeeUsdWei
  ).then(async (transactionReceipt) => {
    const { tx, receipt } = transactionReceipt
    transactionHash = tx
    abiDecoder.addABI(tilRegistryFactory.abi)

    const decoded = abiDecoder.decodeLogs(receipt.logs)

    const NewRegistry = decoded[0]
    tilRegistryAddress = NewRegistry.events.find(arg => arg.name === 'tilRegistry').value
  })

  return {
    tilRegistryAddress,
    transactionHash
  }
}
