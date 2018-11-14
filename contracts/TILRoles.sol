pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/ownership/Ownable.sol";

contract TILRoles is Ownable {
  enum All {
    TOKEN_MINTER,
    JOB_MANAGER
  }

  mapping(address => mapping(uint256 => bool)) addressRoles;

  function init(address _owner) public initializer {
    Ownable.initialize(_owner);
  }

  function hasRole(address _address, uint256 _role) public view returns (bool) {
    return addressRoles[_address][_role];
  }

  function setRole(address _address, uint256 _role, bool _hasRole) public onlyOwner {
    addressRoles[_address][_role] = _hasRole;
  }
}
