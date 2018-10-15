pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract WorkToken is MintableToken {
  string public constant name = "MedX Work Token";
  string public constant symbol = "MDXW";
  uint8 public constant decimals = 18;
}
