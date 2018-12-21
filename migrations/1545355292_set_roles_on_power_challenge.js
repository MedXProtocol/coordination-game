const PowerChallenge = artifacts.require('PowerChallenge.sol')
const TILRoles = artifacts.require('TILRoles.sol')

module.exports = function(deployer) {
  deployer.then(async () => {
    const roles = await TILRoles.deployed()
    const powerChallenge = await PowerChallenge.deployed()
    powerChallenge.setRoles(roles.address)
  })
};
