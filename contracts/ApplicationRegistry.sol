pragma solidity ^0.4.25;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Work.sol";

contract ApplicationRegistry is Ownable {
  Work public work;
  uint256 public applicationCount;

  mapping (address => uint256) public applicationIndex;
  mapping (uint256 => bytes32) public secretAndRandomHash;
  mapping (uint256 => bytes32) public randomHash;
  mapping (uint256 => bytes) public hint;
  mapping (uint256 => address) public verifier;
  mapping (uint256 => bytes) public verifierSecret;
  mapping (uint256 => bytes) public applicantSecret;

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
    bytes secret
  );

  constructor (Work _work) public {
    work = _work;
  }

  function apply (bytes32 _keccakOfSecretAndRandom, bytes32 _keccakOfRandom, bytes _hint) public {
    require(applicationIndex[msg.sender] == 0, 'the applicant has not yet applied');
    applicationCount += 1;
    applicationIndex[msg.sender] = applicationCount;
    secretAndRandomHash[applicationCount] = _keccakOfSecretAndRandom;
    randomHash[applicationCount] = _keccakOfRandom;
    hint[applicationCount] = _hint;
    address v = work.selectWorker(uint256(blockhash(block.number - 1)));
    require(v != address(0), 'verifier is available');
    verifier[applicationCount] = v;
    emit NewApplication(applicationCount, msg.sender, _keccakOfSecretAndRandom, _keccakOfRandom, _hint, v);
  }

  function verify (uint256 applicationId, bytes secret) public {
    require(applicationCount >= applicationId, 'application has been initialized');
    require(msg.sender == verifier[applicationId], 'sender is verifier');
    require(verifierSecret[applicationId].length == 0, 'verify has not already been called');
    require(secret.length > 0, 'secret is not empty');
    verifierSecret[applicationId] = secret;
    emit VerificationSubmitted(applicationId, msg.sender, secret);
  }

  function reveal (bytes secret, uint256 randomNumber) public {
    uint256 id = applicationIndex[msg.sender];
    require(id != uint256(0), 'sender has an application');
    require(verifierSecret[id].length > 0, 'verify has submitted their secret');
    bytes32 srHash = keccak256(abi.encodePacked(secret, randomNumber));
    bytes32 rHash = keccak256(abi.encodePacked(randomNumber));
    require(srHash == secretAndRandomHash[id], 'secret and random hash matches');
    require(rHash == randomHash[id], 'random hash matches');
    applicantSecret[id] = secret;
  }
}
