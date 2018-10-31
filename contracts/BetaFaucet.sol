pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./WorkToken.sol";

contract BetaFaucet is Ownable {
  // Keep track of which Ethereum addresses we've sent Ether and our TILW ERC20 token to
  mapping (address => bool) public sentEtherAddresses;
  mapping (address => bool) public sentTILWAddresses;

  // Amount of gas we want to account for when doing require() checks
  uint256 public constant gasAmount = 1000000;

  event EtherSent(address indexed recipient, uint256 value);
  event WorkTokenSent(address indexed recipient, uint256 value);

  // A reference to your deployed token contract
  WorkToken public workToken;

  // Provides a better way to do calculations via .add(), .sub(), etc.
  using SafeMath for uint256;

  // Constructor which allows us to fund contract on creation
  constructor() public payable {
  }

  // `fallback` function called when eth is sent to this contract
  function () payable {
  }

  /**
   * @dev - Creates a new BetaFaucet contract with the given parameters
   * @param _workToken - the address of the previously deployed Work token contract
   */
  function init(WorkToken _workToken) external {
    workToken = _workToken;
  }

  function setWorkToken(WorkToken _workToken) external onlyOwner {
    workToken = _workToken;
  }

  function withdrawEther() external onlyOwner {
    owner.transfer(address(this).balance.sub(gasAmount));
  }

  function sendEther(address _recipient, uint256 _amount) public onlyOwner {
    require(_recipient != address(0), "recipient address is empty");
    require(!sentEtherAddresses[_recipient], "recipient has already received ether");
    require(_amount > 0, "amount must be positive");
    require(_amount <= 1 ether, "amount must be below the upper limit");
    require(address(this).balance >= _amount.add(gasAmount), "contract is out of ether!");

    sentEtherAddresses[_recipient] = true;
    emit EtherSent(_recipient, _amount);

    _recipient.transfer(_amount);
  }

  function sendTILW(address _recipient, uint256 _amount) public onlyOwner {
    require(_recipient != address(0), "recipient address is empty");
    require(!sentTILWAddresses[_recipient], "recipient has already received TILW");
    require(_amount > 0, "amount must be positive");
    require(_amount <= 1500 ether, "amount must be below the upper limit");
    require(workToken.balanceOf(address(this)) >= _amount, "contract is out of TILW!");

    sentTILWAddresses[_recipient] = true;
    emit WorkTokenSent(_recipient, _amount);

    workToken.transfer(_recipient, _amount);
  }
}
