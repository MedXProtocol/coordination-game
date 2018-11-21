import {
  addContract
} from 'saga-genesis'
import { all } from 'redux-saga/effects'

import betaFaucetConfig from '#/BetaFaucet.json'
import coordinationGameConfig from '#/CoordinationGame.json'
import tilRegistryConfig from '#/TILRegistry.json'
import workConfig from '#/Work.json'
import workTokenConfig from '#/WorkToken.json'
import powerChallengeConfig from '#/PowerChallenge.json'

export const addTruffleArtifactAddresses = function* (contractJson) {
  var networkIds = Object.keys(contractJson.networks)
  yield all(networkIds.map(function* (networkId) {
    var networkConfig = contractJson.networks[networkId]

    if (networkId === '1234')
      console.log(`var ${contractJson.contractName[0].toLowerCase()}${contractJson.contractName.slice(1)}Address = '${networkConfig.address}'`)

    yield addContract({
      networkId,
      address: networkConfig.address,
      name: contractJson.contractName,
      contractKey: contractJson.contractName
    })
  }))
}

export const addContractsSaga = function* () {
  yield addTruffleArtifactAddresses(betaFaucetConfig)
  yield addTruffleArtifactAddresses(coordinationGameConfig)
  yield addTruffleArtifactAddresses(tilRegistryConfig)
  yield addTruffleArtifactAddresses(workConfig)
  yield addTruffleArtifactAddresses(workTokenConfig)
  yield addTruffleArtifactAddresses(powerChallengeConfig)
}
