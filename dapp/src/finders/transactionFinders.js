export const transactionFinders = {
  findByMethodName(state, methodName) {
    return Object.values(state.sagaGenesis.transactions).find(transaction => {
      const { method } = transaction.call
      return method === methodName
    })
  }
}
