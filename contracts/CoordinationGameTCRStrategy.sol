pragma solidity ^0.4.24;

import "./CoordinationGameManager.sol";

contract CoordinationGameTCRStrategy is CoordinationGameManager {
  TCR tcr;

  constructor (TCR _tcr) {
    tcr = _tcr;
  }

  function start(CoordinationGame _game, uint256 _applicantId) {
    address applicant = _game.applicant(_applicantId);
    uint256 deposit = tcr.parameterizer().get("minDeposit");
    tcr.token().transferFrom(applicant, address(this), deposit);
  }

  function applicantWon(CoordinationGame _game, uint256 _applicantId) {
    super.applicantWon(_game, _applicantId);
    address applicant = _game.applicant(_applicantId);
    uint256 deposit = tcr.parameterizer().get("minDeposit");
    tcr.apply(bytes32(_applicantId), deposit, "");
    tcr.transferOwnership(_applicantId, applicant);
  }

  function applicantLost(CoordinationGame _game, uint256 _applicantId) {
    applicantWon(_game, _applicantId);
    tcr.challenge
  }
}
