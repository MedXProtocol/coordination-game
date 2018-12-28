# The Token Registry

[![Logo](medx-protocol.png)](https://medxprotocol.com/)

The Token Registry is a proof-of-concept of a [Trustless Incentivized List](https://medium.com/medxprotocol/a-tcr-protocol-design-for-objective-content-6abb04aac027).  A TIL is a list of entries whose membership is governed by rules.  If an applicant wants to add an entry they must win the Coordination Game.  If an entry's membership is challenged then the entry must pass the Power Challenge.  You can read about the algorithm in detail [here](https://medium.com/medxprotocol/a-tcr-protocol-design-for-objective-content-6abb04aac027).

# Installation

Install dependencies

```
$ yarn install-deps
```

Copy over the default environment variables:

```
$ cp .envrc.example .envrc
```

Set environment variables with [direnv](https://direnv.net/):

```
$ direnv allow
```

**Alternatively**, you can simply source the .envrc file:

```
$ source .envrc
```

# Initial Setup

This project uses ZeppelinOS.  It's important to remember that the **admin** account that creates the contracts is not able to interact with them. It's best to use the *second* account in the Coordination Game owner mnemonic as the admin, because truffle likes to use the first account by default.  The `ADMIN_ACCOUNT` env var is already configured to be the second account from the mnemonic.

Start the local ganache node:

```
$ yarn start
```

Push the contracts to ganache:

```
$ zos push --from $ADMIN_ACCOUNT --network local
```

Migrate the contracts:

```
$ truffle migrate
```

Bootstrap the faucet with Ether and tokens:

```
$ yarn bootstrap
```

Start the dapp dev server:

```
$ yarn dapp
```

Start the lambda dev server:

```
$ yarn lambda
```

# Testing

To test the contracts run:

```
$ yarn test
```

To run the Dapp test watcher run:

```
$ yarn dapp-test-watch
```

### Deploying to Ropsten

Make sure all of the Ropsten contracts are up-to-date:

```
$ npm run push-ropsten
```

Next, ensure that the Ropsten proxy addresses are merged into the build artifacts

```
$ npm run merge-ropsten
```

Now run the migrations against Ropsten:

```
$ truffle migrate --network ropsten
```
