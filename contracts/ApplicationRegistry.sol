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

  event NewApplication(
    address applicant,
    bytes32 secretAndRandomHash,
    bytes32 randomHash,
    bytes hint,
    address verifier
  );

  constructor (Work _work) public {
    work = _work;
  }

  function apply (bytes32 _keccakOfSecretAndRandom, bytes32 _keccakOfRandom, bytes _hint) public {
    applicationCount += 1;
    applicationIndex[msg.sender] = applicationCount;
    secretAndRandomHash[applicationCount] = _keccakOfSecretAndRandom;
    randomHash[applicationCount] = _keccakOfRandom;
    hint[applicationCount] = _hint;
    address v = work.selectWorker(uint256(blockhash(block.number - 1)));
    require(v != address(0), 'verifier is available');
    verifier[applicationCount] = v;
    emit NewApplication(msg.sender, _keccakOfSecretAndRandom, _keccakOfRandom, _hint, v);
  }
}
