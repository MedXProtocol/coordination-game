pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract Work is Ownable {
  ERC20 public token;
  address[] private stakers;
  uint256 public requiredStake;
  mapping (address => bool) public stakerAddresses;
  mapping (address => uint256) private stakerIndices;
  mapping (address => uint256) private stakerAmounts;
  mapping (address => uint256) private lockedStakeAmounts; // use this

  constructor (ERC20 _token, uint256 _requiredStake) public {
    require(_token != address(0), 'token is defined');
    require(_requiredStake > 0, 'stake is greater than zero');
    token = _token;
    requiredStake = _requiredStake;

    // require(token.allowance(msg.sender, address(this)) >= requiredStake, 'allowance is sufficient');
  }

  function approve(address _spender) onlyOwner {
    uint256 maxInt = 0;
    maxInt -= 1;
    require(token.approve(_spender, maxInt), 'the spender is allowed unlimited tokens');
  }

  function depositStake() public hasNotStaked(msg.sender) {
    uint256 index = stakers.push(msg.sender) - 1;
    stakerIndices[msg.sender] = index;
    stakerAddresses[msg.sender] = true;
    require(token.allowance(msg.sender, address(this)) >= requiredStake, 'allowance is sufficient');
    token.transferFrom(msg.sender, address(this), requiredStake);
  }

  function withdrawStake() public hasStaked(msg.sender) {
    stakerAddresses[msg.sender] = false;
    uint256 index = stakerIndices[msg.sender];
    uint256 lastIndex = stakers.length - 1;
    if (index != lastIndex) {
      address lastStaker = stakers[lastIndex];
      stakers[index] = lastStaker;
      stakerIndices[lastStaker] = index;
    }
    stakers.length--;
    token.transfer(msg.sender, requiredStake);
  }

  function selectWorker(uint256 randomValue) public view returns (address) {
    uint256 index = randomValue % stakers.length;
    return stakers[index];
  }

  modifier hasNotStaked(address _staker) {
    require(!stakerAddresses[_staker], 'Staker has not staked');
    _;
  }

  modifier hasStaked(address _staker) {
    require(stakerAddresses[_staker], 'Staker has staked');
    _;
  }
}
