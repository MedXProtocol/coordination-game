pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "tcr/Parameterizer.sol";
import "./Work.sol";
import "./TILRegistry.sol";

contract CoordinationGame is Ownable {
  Work work;
  TILRegistry tilRegistry;
  uint256 public applicationCount;

  mapping (address => uint256) public applicationIndices;
  mapping (uint256 => address) public applicants;
  mapping (uint256 => bytes32) public secretAndRandomHashes;
  mapping (uint256 => bytes32) public randomHashes;
  mapping (uint256 => bytes) public hints;
  mapping (uint256 => address) public verifiers;
  mapping (uint256 => bytes32) public verifierSecrets;
  mapping (uint256 => bytes32) public applicantSecrets;
  mapping (address => uint256) wins;
  mapping (address => uint256) losses;

  event NewApplication(
    uint256 indexed applicationId,
    address indexed applicant,
    address indexed verifier,
    bytes32 secretAndRandomHash,
    bytes32 randomHash,
    bytes hint
  );

  event VerificationSubmitted(
    uint256 indexed applicationId,
    address verifier,
    bytes32 secret
  );

  event ApplicantWon(
    uint256 indexed applicationId
  );

  event ApplicantLost(
    uint256 indexed applicationId
  );

  /**
  @notice Creates a new CoordinationGame
  @param _work the Work contract to select verifiers
  */
  function init(Work _work, TILRegistry _tilRegistry) public {
    work = _work;
    tilRegistry = _tilRegistry;
  }

  /**
  @notice Creates an application on behalf of the message sender
  @param _keccakOfSecretAndRandom The hash of the secret and salt
  @param _keccakOfRandom The hash of the salt
  @param _hint The hint for the verifier to determine the secret
  */
  function apply (bytes32 _keccakOfSecretAndRandom, bytes32 _keccakOfRandom, bytes _hint) public {
    require(applicationIndices[msg.sender] == 0, 'the applicant has not yet applied');
    applicationCount += 1;
    applicationIndices[msg.sender] = applicationCount;
    applicants[applicationCount] = msg.sender;
    secretAndRandomHashes[applicationCount] = _keccakOfSecretAndRandom;
    randomHashes[applicationCount] = _keccakOfRandom;
    hints[applicationCount] = _hint;
    address v = work.selectWorker(uint256(blockhash(block.number - 1)));
    require(v != address(0), 'verifier is available');
    verifiers[applicationCount] = v;
    start(applicationCount);

    emit NewApplication(applicationCount, msg.sender, v, _keccakOfSecretAndRandom, _keccakOfRandom, _hint);
  }

  /**
  @notice Allows the verifier to submit their secret
  @param _applicationId The application that the verifier is submitting for
  @param _secret The secret that the verifier is guessing
  */
  function verify (uint256 _applicationId, bytes32 _secret) public {
    require(applicationCount >= _applicationId, 'application has been initialized');
    require(msg.sender == verifiers[_applicationId], 'sender is verifier');
    require(verifierSecrets[_applicationId] == bytes32(0), 'verify has not already been called');
    require(_secret.length > 0, 'secret is not empty');
    verifierSecrets[_applicationId] = _secret;
    emit VerificationSubmitted(_applicationId, msg.sender, _secret);
  }

  /**
  @notice Allows the applicant to reveal their secret
  @param _secret The applicant's secret
  @param _randomNumber The random number the applicant chose to obscure the secret
  */
  function reveal (bytes32 _secret, uint256 _randomNumber) public {
    uint256 id = applicationIndices[msg.sender];
    require(id != uint256(0), 'sender has an application');
    require(verifierSecrets[id] != bytes32(0), 'verify has submitted their secret');
    bytes32 srHash = keccak256(abi.encodePacked(_secret, _randomNumber));
    bytes32 rHash = keccak256(abi.encodePacked(_randomNumber));
    require(srHash == secretAndRandomHashes[id], 'secret and random hash matches');
    require(rHash == randomHashes[id], 'random hash matches');
    applicantSecrets[id] = _secret;

    if (_secret != verifierSecrets[id]) {
      emit ApplicantWon(id);
      applicantLost(id);
    } else {
      emit ApplicantLost(id);
      applicantWon(id);
    }
  }

  function start(uint256 _applicantId) internal {
    address applicant = applicants[_applicantId];
    uint256 deposit = tilRegistry.parameterizer().get("minDeposit");
    // tilRegistry.token().transferFrom(applicant, address(this), deposit);
  }

  function applicantWon(uint256 _applicantId) internal {
    address applicant = applicants[_applicantId];
    wins[applicant] += 1;

    uint256 deposit = tilRegistry.parameterizer().get("minDeposit");
    // tilRegistry.apply(bytes32(_applicantId), deposit, "");
    // tilRegistry.transferOwnership(bytes32(_applicantId), applicant);
  }

  function applicantLost(uint256 _applicantId) internal {
    address applicant = applicants[_applicantId];
    losses[applicant] += 1;

    // tilRegistry.challenge
  }
}
