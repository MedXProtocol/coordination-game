/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like truffle-hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura API
 * keys are available for free at: infura.io/register
 *
 *   > > Using Truffle V5 or later? Make sure you install the `web3-one` version.
 *
 *   > > $ npm install truffle-hdwallet-provider@web3-one
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

// const HDWallet = require('truffle-hdwallet-provider');
// const infuraKey = "fj4jll3k.....";
//
// const fs = require('fs');
// const mnemonic = fs.readFileSync(".secret").toString().trim();

// require('babel-register')
// require('babel-polyfill')

var HDWalletProvider = require("truffle-hdwallet-provider")

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "1234",       // Any network (default: none)
      gas: 4700000,
      gasPrice: 2 * 1000000000
    },
    ropsten: {
      provider: () => new HDWalletProvider(process.env.HDWALLET_MNEMONIC, process.env.REACT_APP_ROPSTEN_PROVIDER_URL),
      network_id: 3,
      gas: 8000000,
      gasPrice: 61 * 1000000000
    },
    rinkeby: {
      provider: () => new HDWalletProvider(process.env.HDWALLET_MNEMONIC, process.env.REACT_APP_RINKEBY_PROVIDER_URL),
      network_id: 4,
      gas: 4700000,
      gasPrice: 60 * 1000000000
    },
    mainnet: {
      provider: () => new HDWalletProvider(process.env.HDWALLET_MNEMONIC_MAINNET, process.env.REACT_APP_MAINNET_PROVIDER_URL),
      network_id: 1,
      gas: 4700000,
      gasPrice: 2 * 1000000000
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    timeout: 100000
  }
}
