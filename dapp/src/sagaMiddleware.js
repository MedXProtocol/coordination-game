import createSagaMiddleware from 'redux-saga'
import { ContractRegistry, CallCountRegistry } from 'saga-genesis'
import { contractRegistryOptions } from './contractRegistryOptions'

export const writeContractRegistry = new ContractRegistry(contractRegistryOptions)
export const readContractRegistry = new ContractRegistry(contractRegistryOptions)
export const callCountRegistry = new CallCountRegistry()
export const logRegistry = new CallCountRegistry()

export const sagaMiddleware = createSagaMiddleware({
  context: {
    writeContractRegistry,
    readContractRegistry,
    callCountRegistry,
    logRegistry
  }
})
