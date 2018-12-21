pragma solidity ^0.4.24;

import "../CoordinationGame.sol";

library VerifierSubmitSecret {
  function execute(
    CoordinationGame.Game storage game,
    CoordinationGame.Verification storage verification,
    bytes32 _secret,
    uint256 _msgValue) public {
    require(_msgValue >= game.applicationFeeWei, 'verifier is submitting enough ether');
    require(verification.verifierSecret == bytes32(0), 'verify has not already been called');

    verification.verifierSecret = _secret;
    verification.verifierSubmittedAt = block.timestamp;
    verification.verifierDepositWei = _msgValue;
    game.updatedAt = block.timestamp;
  }
}
