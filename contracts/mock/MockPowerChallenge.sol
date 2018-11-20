pragma solidity ^0.4.24;

contract MockPowerChallenge {
  bytes32[] startChallenges;

  function startChallenge(bytes32 _id) external {
    startChallenges.push(_id);
  }
}
