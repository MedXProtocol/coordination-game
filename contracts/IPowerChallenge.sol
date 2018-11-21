pragma solidity ^0.4.24;

contract IPowerChallenge {
  function startApprovalFrom(bytes32 _id, uint256 _amount, address _payer, address _beneficiary) public;
  function challengeFrom(bytes32 _id, address _payer, address _beneficiary) public;
}
