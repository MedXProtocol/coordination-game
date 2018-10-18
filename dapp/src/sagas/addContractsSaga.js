import {
  select,
  all
} from 'redux-saga/effects'
import {
  contractByName,
  addContract,
  web3Call
} from 'saga-genesis'
const debug = require('debug')('addContractsSaga.js')

function* lookupAndAddContract(web3, name) {
  // const Registry = yield select(contractByName, 'Registry')
  // const address = yield web3Call(Registry, 'lookup', web3.utils.sha3(name))
  if (address) {
    yield addContract({address, name, contractKey: name})
    debug(`Added ${name} at ${address}`)
  } else {
    debug(`Skipping ${name} which is unregistered`)
  }
}

export default function* ({ web3 }) {
  yield all([
    lookupAndAddContract(web3, 'WrappedEther'),
    lookupAndAddContract(web3, 'Dai'),
    lookupAndAddContract(web3, 'AdminSettings'),
    lookupAndAddContract(web3, 'CaseManager'),
    lookupAndAddContract(web3, 'CaseDiagnosingDoctor'),
    lookupAndAddContract(web3, 'CaseLifecycleManager'),
    lookupAndAddContract(web3, 'CaseScheduleManager'),
    lookupAndAddContract(web3, 'CaseFirstPhaseManager'),
    lookupAndAddContract(web3, 'CaseSecondPhaseManager'),
    lookupAndAddContract(web3, 'CasePaymentManager'),
    lookupAndAddContract(web3, 'CaseStatusManager'),
    lookupAndAddContract(web3, 'DoctorManager'),
    lookupAndAddContract(web3, 'AccountManager'),
    lookupAndAddContract(web3, 'BetaFaucet'),
    lookupAndAddContract(web3, 'FromBlockNumber')
  ])
}

// -rw-r--r--   1 chuckbergeron  staff    61K 17 Oct 13:10 AttributeStore.json
// -rw-r--r--   1 chuckbergeron  staff   104K 17 Oct 13:10 BasicToken.json
// -rw-r--r--   1 chuckbergeron  staff   910K 17 Oct 13:10 CoordinationGame.json
// -rw-r--r--   1 chuckbergeron  staff   106K 17 Oct 13:10 CoordinationGameFactory.json
// -rw-r--r--   1 chuckbergeron  staff   341K 17 Oct 13:10 DLL.json
// -rw-r--r--   1 chuckbergeron  staff   246K 17 Oct 13:10 EIP20.json
// -rw-r--r--   1 chuckbergeron  staff    62K 17 Oct 13:10 EIP20Interface.json
// -rw-r--r--   1 chuckbergeron  staff    39K 17 Oct 13:10 ERC20.json
// -rw-r--r--   1 chuckbergeron  staff    27K 17 Oct 13:10 ERC20Basic.json
// -rw-r--r--   1 chuckbergeron  staff    52K 17 Oct 13:10 Migrations.json
// -rw-r--r--   1 chuckbergeron  staff   135K 17 Oct 13:10 MintableToken.json
// -rw-r--r--   1 chuckbergeron  staff    87K 17 Oct 13:10 Ownable.json
// -rw-r--r--   1 chuckbergeron  staff   186K 17 Oct 13:10 PLCRFactory.json
// -rw-r--r--   1 chuckbergeron  staff   1.4M 17 Oct 13:10 PLCRVoting.json
// -rw-r--r--   1 chuckbergeron  staff   1.4M 17 Oct 13:10 Parameterizer.json
// -rw-r--r--   1 chuckbergeron  staff   232K 17 Oct 13:10 ParameterizerFactory.json
// -rw-r--r--   1 chuckbergeron  staff   106K 17 Oct 13:10 ProxyFactory.json
// -rw-r--r--   1 chuckbergeron  staff   1.4M 17 Oct 13:10 Registry.json
// -rw-r--r--   1 chuckbergeron  staff    92K 17 Oct 13:10 SafeMath.json
// -rw-r--r--   1 chuckbergeron  staff   303K 17 Oct 13:10 StandardToken.json
// -rw-r--r--   1 chuckbergeron  staff    58K 17 Oct 13:10 TILPLCRFactory.json
// -rw-r--r--   1 chuckbergeron  staff   138K 17 Oct 13:10 TILParameterizer.json
// -rw-r--r--   1 chuckbergeron  staff   6.7K 17 Oct 13:10 TILParameterizerFactory.json
// -rw-r--r--   1 chuckbergeron  staff   349K 17 Oct 13:10 TILRegistry.json
// -rw-r--r--   1 chuckbergeron  staff   168K 17 Oct 13:10 TILRegistryFactory.json
// -rw-r--r--   1 chuckbergeron  staff   293K 17 Oct 13:10 Work.json
// -rw-r--r--   1 chuckbergeron  staff    52K 17 Oct 13:10 WorkToken.json
