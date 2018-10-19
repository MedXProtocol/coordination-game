import { txErrorToCode } from '~/services/txErrorToCode'

const errorMessages = {
  userRevert: 'You rejected the transaction.',
  outOfGas: 'The transaction ran out of gas.',
  evmRevert: 'There was an error in the contract.',
  incorrectNonce: 'The nonce was incorrect (reset the account in MetaMask).',
  cancelled: 'The transaction was cancelled.',
  noContractFound: 'No contract found for address, you may be on the wrong network (MainNet vs. Ropsten).',
  nonceTooLow: 'The nonce was too low (possibly need to reset the account in MetaMask).',
  exceedsBlockGasLimit: 'The transaction gasLimit exceeds block gas limit.',
  replacementTransactionUnderpriced: 'The replacement transaction is underpriced (need to provide a higher gas limit).'
}

export const txErrorMessage = function (error) {
  let message
  let errorMessage = error

  // we actually want the error msg string, so if that exists use it instead:
  if (error.message) {
    errorMessage = error.message
  }

  const code = txErrorToCode(errorMessage)
  message = 'There was a transaction error.'
  if (code) {
    message = errorMessages[code]
  }

  return message
}
