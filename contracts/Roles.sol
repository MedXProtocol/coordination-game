pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Roles is Ownable {
    mapping(address => mapping(uint256 => bool)) addressRoles;

    function hasRole(address _address, uint256 _role) public view returns (bool) {
      return addressRoles[_address][_role];
    }

    function setRole(address _address, uint256 _role, bool _hasRole) public onlyOwner {
      addressRoles[_address][_role] = _hasRole;
    }
}
