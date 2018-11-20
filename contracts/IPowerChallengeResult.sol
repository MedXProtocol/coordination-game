pragma solidity ^0.4.24;

interface IPowerChallengeResult {
  function challengeSucceeded(bytes32 _id);
  function challengeFailed(bytes32 _id);
}
