pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract WorkToken is MintableToken {
  string public constant name = "TIL Work Token";
  string public constant symbol = "TILW";
  uint8 public constant decimals = 18;
}
