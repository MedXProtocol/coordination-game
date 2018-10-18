import coordinationGameConfig from '#/CoordinationGame.json'

import { abiFactory } from 'saga-genesis'

export const contractRegistryOptions = {
  contractFactories: {
    CoordinationGame: abiFactory(coordinationGameConfig.abi)
  }
}
