import coordinationGameConfig from '#/CoordinationGame.json'
import tilRegistryConfig from '#/TILRegistry.json'
import parameterizerConfig from '#/Parameterizer.json'
import workConfig from '#/Work.json'
import workTokenConfig from '#/WorkToken.json'

import { abiFactory } from 'saga-genesis'

export const contractRegistryOptions = {
  contractFactories: {
    CoordinationGame: abiFactory(coordinationGameConfig.abi),
    TILRegistry: abiFactory(tilRegistryConfig.abi),
    Parameterizer: abiFactory(parameterizerConfig.abi),
    Work: abiFactory(workConfig.abi),
    WorkToken: abiFactory(workTokenConfig.abi)
  }
}
