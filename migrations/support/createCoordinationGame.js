const abiDecoder = require('abi-decoder')

module.exports = async function (
  coordinationGameFactory,
  etherPriceFeedAddress,
  workAddress,
  registryAddress,
  owner,
  applicationStakeAmount,
  baseApplicationFeeUsdWei
) {
  let coordinationGameAddress, transactionHash

  await coordinationGameFactory.createCoordinationGame(
    etherPriceFeedAddress,
    workAddress,
    registryAddress,
    owner,
    applicationStakeAmount,
    baseApplicationFeeUsdWei
  ).then(async (transactionReceipt) => {
    const { tx, receipt } = transactionReceipt
    transactionHash = tx
    abiDecoder.addABI(coordinationGameFactory.abi)

    const decoded = abiDecoder.decodeLogs(receipt.logs)

    const CoordinationGameCreated = decoded[1]
    coordinationGameAddress =
      CoordinationGameCreated.events.find(arg => arg.name === 'coordinationGame').value
  })

  return {
    coordinationGameAddress,
    transactionHash
  }
}
