export const transactionFinders = {
  approve (state) {
    return Object.values(state.sagaGenesis.transactions).find(transaction => {
      const { method } = transaction.call
      return method === 'approve'
    })
  }
}
