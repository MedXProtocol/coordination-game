pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "tcr/Parameterizer.sol";
import "./Work.sol";
import "./Registry.sol";

contract CoordinationGame is Ownable {
  Work work;
  uint256 public applicationCount;

  mapping (address => uint256) public applicationIndex;
  mapping (uint256 => address) public applicant;
  mapping (uint256 => bytes32) public secretAndRandomHash;
  mapping (uint256 => bytes32) public randomHash;
  mapping (uint256 => bytes) public hint;
  mapping (uint256 => address) public verifier;
  mapping (uint256 => bytes32) public verifierSecret;
  mapping (uint256 => bytes32) public applicantSecret;

  event NewApplication(
    uint256 applicationId,
    address applicant,
    bytes32 secretAndRandomHash,
    bytes32 randomHash,
    bytes hint,
    address verifier
  );

  event VerificationSubmitted(
    uint256 applicationId,
    address verifier,
    bytes32 secret
  );

  /**
  @notice Creates a new CoordinationGame
  @param _work the Work contract to select verifiers
  */
  function init (Work _work) public {
    work = _work;
  }

  /**
  @notice Creates an application on behalf of the message sender
  @param _keccakOfSecretAndRandom The hash of the secret and salt
  @param _keccakOfRandom The hash of the salt
  @param _hint The hint for the verifier to determine the secret
  */
  function apply (bytes32 _keccakOfSecretAndRandom, bytes32 _keccakOfRandom, bytes _hint) public {
    require(applicationIndex[msg.sender] == 0, 'the applicant has not yet applied');
    applicationCount += 1;
    applicationIndex[msg.sender] = applicationCount;
    applicant[applicationCount] = msg.sender;
    secretAndRandomHash[applicationCount] = _keccakOfSecretAndRandom;
    randomHash[applicationCount] = _keccakOfRandom;
    hint[applicationCount] = _hint;
    address v = work.selectWorker(uint256(blockhash(block.number - 1)));
    require(v != address(0), 'verifier is available');
    verifier[applicationCount] = v;
    emit NewApplication(applicationCount, msg.sender, _keccakOfSecretAndRandom, _keccakOfRandom, _hint, v);
  }

  /**
  @notice Allows the verifier to submit their secret
  @param _applicationId The application that the verifier is submitting for
  @param _secret The secret that the verifier is guessing
  */
  function verify (uint256 _applicationId, bytes32 _secret) public {
    require(applicationCount >= _applicationId, 'application has been initialized');
    require(msg.sender == verifier[_applicationId], 'sender is verifier');
    require(verifierSecret[_applicationId] == bytes32(0), 'verify has not already been called');
    require(_secret.length > 0, 'secret is not empty');
    verifierSecret[_applicationId] = _secret;
    emit VerificationSubmitted(_applicationId, msg.sender, _secret);
  }

  /**
  @notice Allows the applicant to reveal their secret
  @param _secret The applicant's secret
  @param _randomNumber The random number the applicant chose to obscure the secret
  */
  function reveal (bytes32 _secret, uint256 _randomNumber) public {
    uint256 id = applicationIndex[msg.sender];
    require(id != uint256(0), 'sender has an application');
    require(verifierSecret[id] != bytes32(0), 'verify has submitted their secret');
    bytes32 srHash = keccak256(abi.encodePacked(_secret, _randomNumber));
    bytes32 rHash = keccak256(abi.encodePacked(_randomNumber));
    require(srHash == secretAndRandomHash[id], 'secret and random hash matches');
    require(rHash == randomHash[id], 'random hash matches');
    applicantSecret[id] = _secret;

    if (_secret != verifierSecret[id]) {
      // lose
    } else {
      // win
    }
  }
}
