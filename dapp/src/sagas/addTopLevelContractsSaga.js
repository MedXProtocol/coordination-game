import {
  addContract
} from '~/saga-genesis/sagas'
import { all } from 'redux-saga/effects'
import coordinationGame from '#/CoordinationGame.json'
// import medXTokenContractConfig from '#/MedXToken.json'
// import registryConfig from '#/Registry.json'

export const addTruffleArtifactAddresses = function* (abi) {
  debugger

  var networkIds = Object.keys(config.networks)
  yield all(networkIds.map(function* (networkId) {
    var networkConfig = config.networks[networkId]

    yield addContract({
      address: networkConfig.address,
      abi.name,
      networkId,
      contractKey: abi.name
    })
  }))
}

export const addTopLevelContractsSaga = function* () {
  debugger
  // contractNames.forEach(contractName, {
  //   yield addTruffleArtifactAddresses(registryConfig, 'Registry')
  // })
}
