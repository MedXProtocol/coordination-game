pragma solidity ^0.4.24;

import "./Roles.sol";

contract TILRoles is Roles {
  enum All {
    TOKEN_MINTER,
    JOB_MANAGER
  }
}
