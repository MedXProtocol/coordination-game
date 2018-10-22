import { get } from 'lodash'

export const externalTransactionFinders = {
  sendTILW (state) {
    const externalTransactions = get(state, 'externalTransactions.transactions')
    return externalTransactions.find((tx) => tx.txType === 'sendTILW')
  },

  sendEther (state) {
    const externalTransactions = get(state, 'externalTransactions.transactions')
    return externalTransactions.find((tx) => tx.txType === 'sendEther')
  }
}
