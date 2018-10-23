import {
  addContract
} from 'saga-genesis'
import { all } from 'redux-saga/effects'

import betaFaucetConfig from '#/BetaFaucet.json'
import coordinationGameConfig from '#/CoordinationGame.json'
import tilRegistryConfig from '#/TILRegistry.json'
import parameterizerConfig from '#/Parameterizer.json'
import workConfig from '#/Work.json'
import workTokenConfig from '#/WorkToken.json'

export const addTruffleArtifactAddresses = function* (contractJson) {
  var networkIds = Object.keys(contractJson.networks)
  yield all(networkIds.map(function* (networkId) {
    var networkConfig = contractJson.networks[networkId]

    if (networkId === '1234')
      console.log(contractJson.contractName, networkConfig.address)

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
  yield addTruffleArtifactAddresses(parameterizerConfig)
  yield addTruffleArtifactAddresses(workConfig)
  yield addTruffleArtifactAddresses(workTokenConfig)
}
