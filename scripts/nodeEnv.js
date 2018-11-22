/*

When running `truffle console` you can load this by typing `.load scripts/nodeEnv.js`

*/
CoordinationGame.deployed().then(i => cg = i)
WorkToken.deployed().then(i => wt = i)
Work.deployed().then(i => w = i)
PowerChallenge.deployed().then(i => pc = i)
TILRegistry.deployed().then(i => reg = i)
listing1 = '0x0000000000000000000000000000000000000000000000000000000000000001'
listing2 = '0x0000000000000000000000000000000000000000000000000000000000000002'
