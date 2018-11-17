pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/token/ERC20/ERC20Mintable.sol";

contract WorkToken is ERC20Mintable {
  string public constant name = "TEX Work Token";
  string public constant symbol = "TEX";
  uint8 public constant decimals = 18;

  function init(address _owner) public initializer {
    ERC20Mintable.initialize(_owner);
  }
}
