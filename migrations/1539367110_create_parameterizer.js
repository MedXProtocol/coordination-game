const abi = require('ethereumjs-abi')
const abiDecoder = require('abi-decoder')
const ParameterizerFactory = artifacts.require('ParameterizerFactory.sol')
const WorkToken = artifacts.require('WorkToken.sol')
const Work = artifacts.require('Work.sol')
const Parameterizer = artifacts.require('Parameterizer.sol')
const tdr = require('truffle-deploy-registry')

module.exports = function(deployer, networkName) {
  deployer.then(async () => {
    const parameterizerFactory = await ParameterizerFactory.deployed()
    const workToken = await WorkToken.deployed()
    const work = await Work.deployed()
    await parameterizerFactory.newParameterizerBYOToken(workToken.address, [
      // minimum deposit for listing to be whitelisted
      await work.jobStake(),

      // minimum deposit to propose a reparameterization
      web3.toWei('10000000000', 'ether'),

      // period over which applicants wait to be whitelisted
      0,

      // period over which reparmeterization proposals wait to be processed
      3600 * 24 * 3, // 3 days

      // length of commit period for voting
      3600 * 24 * 3, // 3 days

      // length of commit period for voting in parameterizer
      3600 * 24 * 3, // 3 days

      // length of reveal period for voting
      3600 * 24 * 3, // 3 days

      // length of reveal period for voting in parameterizer
      3600 * 24 * 3, // 3 days

      // percentage of losing party's deposit distributed to winning party
      100,

      // percentage of losing party's deposit distributed to winning party in parameterizer
      50,

      // type of majority out of 100 necessary for candidate success
      30,

      // type of majority out of 100 necessary for proposal success in parameterizer
      30//,

      // // length of time in seconds an applicant has to wait for the verifier to
      // // submit a secret before choosing a new verifier
      // 120
    ]).then(transactionReceipt => {
      const transactionHash = transactionReceipt.tx
      const receipt = transactionReceipt.receipt

      if (!transactionHash) { throw new Error('transactionHash must exist') }
      if (!receipt) { throw new Error('receipt must exist') }

      abiDecoder.addABI(parameterizerFactory.abi)
      const decoded = abiDecoder.decodeLogs(receipt.logs)
      const NewParameterizer = decoded[decoded.length - 1]
      event = NewParameterizer.events.find(event => event.name === 'parameterizer')

      if (!tdr.isDryRunNetworkName(networkName)) {
        return tdr.append(deployer.network_id, {
          contractName: 'Parameterizer',
          address: event.value,
          transactionHash: transactionHash
        })
      }
    })
  })
};
