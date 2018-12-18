pragma solidity ^0.4.24;

contract GameBundle {
  bytes32 public applicationId;
  address public applicant;
  bytes32 public secretAndRandomHash;
  bytes32 public randomHash;
  bytes public hint;
  uint256 public createdAt;
  uint256 public updatedAt;
  uint256 public applicationFeeWei;
  uint256 public applicantTokenDeposit;
  uint256 public randomBlockNumber;
  bytes32 public applicantSecret;
  address public whistleblower;
  uint256 public verifierSelectedAt;
  address public verifier;
  bytes32 public verifierSecret;
  uint256 public verifierSubmittedAt;
  uint256 public verifierChallengedAt;
  uint256 public verifierDepositWei;

  //
  // function isApplicant(GameBundle storage self, address _sender) external view returns (bool) {
  //   return self.game.applicant == _sender;
  // }
  //
  // function isVerifier(GameBundle storage self, address _sender) external view returns (bool) {
  //   return self.verification.verifier == _sender;
  // }
  //
  // function randomBlockWasMined(GameBundle storage self) external view returns (bool) {
  //   return block.number >= self.game.randomBlockNumber;
  // }
  //
  // function applicationStarted(GameBundle storage self) external view returns (bool) {
  //   return self.game.secretAndRandomHash != bytes32(0);
  // }
  //
  // function isNewApplication(GameBundle storage self) external view returns (bool) {
  //   return self.game.applicant == address(0);
  // }
  //
  // function secretNotRevealed(GameBundle storage self) external view returns (bool) {
  //   return self.game.applicantSecret == bytes32(0);
  // }
  //
  // function notWhistleblown(GameBundle storage self) external view returns (bool) {
  //   return self.game.whistleblower == address(0);
  // }

  function isComplete() public view returns (bool) {
    return (
      applicantSecret != 0 || //applicant submitted
      whistleblower != address(0) || // application whistleblown
      verifierChallengedAt != 0 // verifier challenged
    );
  }

  function game() external view returns (
    bytes32, // applicationId
    address, // applicant
    bytes32, // secretAndRandomHash
    bytes32, // randomHash
    bytes, // hint
    uint256, // createdAt
    uint256, // updatedAt
    uint256, // applicationFeeWei
    uint256, // applicantTokenDeposit
    uint256, // randomBlockNumber
    bytes32, // applicantSecret
    address // whistleblower
  ) {
    return (
      applicationId,
      applicant,
      secretAndRandomHash,
      randomHash,
      hint,
      createdAt,
      updatedAt,
      applicationFeeWei,
      applicantTokenDeposit,
      randomBlockNumber,
      applicantSecret,
      whistleblower
    );
  }

  function verification() external view returns (
    uint256, // verifierSelectedAt
    address, // verifier
    bytes32, // verifierSecret
    uint256, // verifierSubmittedAt
    uint256, // verifierChallengedAt
    uint256 // verifierDepositWei
  ) {
    return (
      verifierSelectedAt,
      verifier,
      verifierSecret,
      verifierSubmittedAt,
      verifierChallengedAt,
      verifierDepositWei
    );
  }
}
