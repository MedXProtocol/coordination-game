pragma solidity ^0.4.24;

import "./CoordinationGame.sol";

contract CoordinationGameManager {
  mapping (address => uint256) wins;
  mapping (address => uint256) losses;

  function start(CoordinationGame _game, uint256 _applicantId) {
    // can transfer tokens here
  }

  function applicantWon(CoordinationGame _game, uint256 _applicantId) {
    address applicant = _game.applicant(_applicantId);
    wins[applicant] += 1;
  }

  function applicantLost(CoordinationGame _game, uint256 _applicantId) {
    address applicant = _game.applicant(_applicantId);
    losses[applicant] += 1;
  }
}
