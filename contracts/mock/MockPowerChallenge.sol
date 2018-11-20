pragma solidity ^0.4.24;

import "../IPowerChallenge.sol";

contract MockPowerChallenge is IPowerChallenge {
  struct StartApprovalFrom {
    bytes32 _id;
    uint256 _amount;
    address _payer;
    address _beneficiary;
  }

  struct ChallengeFrom {
    bytes32 _id;
    address _payer;
    address _beneficiary;
  }

  StartApprovalFrom[] public startApprovalFroms;
  ChallengeFrom[] public challengeFroms;

  mapping(bytes32 => uint256) states;

  function startApprovalFrom(bytes32 _id, uint256 _amount, address _payer, address _beneficiary) public {
    startApprovalFroms.push(StartApprovalFrom(
      _id,
      _amount,
      _payer,
      _beneficiary
    ));
  }

  function challengeFrom(bytes32 _id, address _payer, address _beneficiary) public {
    challengeFroms.push(ChallengeFrom(
      _id,
      _payer,
      _beneficiary
    ));
  }

  function setState(bytes32 _id, uint256 _state) public {
    states[_id] = _state;
  }

  function getState(bytes32 _id) public returns (uint256) {
    return states[_id];
  }

  function isComplete(bytes32 _id) public returns (bool) {
    return states[_id] == 3 || states[_id] == 4;
  }
}
