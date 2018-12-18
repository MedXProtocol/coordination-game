pragma solidity ^0.4.24;

import "../TILRegistry.sol";

contract MockCoordinationGame {
  mapping(bytes32 => bool) public removed;

  TILRegistry public tilRegistry;

  function removeApplication(bytes32 _applicationId) external {
    removed[_applicationId] = true;
  }

  function setRegistry(TILRegistry _tilRegistry) external {
    tilRegistry = _tilRegistry;
  }
}
