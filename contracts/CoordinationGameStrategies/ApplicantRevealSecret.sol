pragma solidity ^0.4.24;

import "../CoordinationGame.sol";

library ApplicantRevealSecret {
  function execute(
    CoordinationGame.Game storage game,
    CoordinationGame.Verification storage verification,
    bytes32 _secret,
    uint256 _randomNumber) public {
    require(verification.verifierSecret != bytes32(0), 'verifier has submitted their secret');

    bytes32 srHash = keccak256(abi.encodePacked(_secret, _randomNumber));
    bytes32 rHash = keccak256(abi.encodePacked(_randomNumber));
    require(srHash == game.secretAndRandomHash, 'secret and random hash matches');
    require(rHash == game.randomHash, 'random hash matches');

    game.updatedAt = block.timestamp;
    game.applicantSecret = _secret;
  }
}
