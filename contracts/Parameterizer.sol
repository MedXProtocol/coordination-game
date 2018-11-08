pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import { Parameterizer as C } from "tcr/Parameterizer.sol";

contract Parameterizer is C, Initializable {
  /**
  @dev Initializer        Can only be called once
  @param _token           The address where the ERC20 token contract is deployed
  @param _plcr            address of a PLCR voting contract for the provided token
  @notice _parameters     array of canonical parameters
  */
  function init(
      address _token,
      address _plcr,
      uint[] _parameters
  ) public initializer {
    C.init(_token, _plcr, _parameters);
    PROCESSBY = 604800;
  }
}
