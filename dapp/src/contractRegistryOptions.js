import betaFaucetConfig from '#/BetaFaucet.json'
import coordinationGameConfig from '#/CoordinationGame.json'
import tilRegistryConfig from '#/TILRegistry.json'
import workConfig from '#/Work.json'
import workTokenConfig from '#/WorkToken.json'

import { abiFactory } from 'saga-genesis'

export const contractRegistryOptions = {
  contractFactories: {
    BetaFaucet: abiFactory(betaFaucetConfig.abi),
    CoordinationGame: abiFactory(coordinationGameConfig.abi),
    TILRegistry: abiFactory(tilRegistryConfig.abi),
    Work: abiFactory(workConfig.abi),
    WorkToken: abiFactory(workTokenConfig.abi)
  }
}
