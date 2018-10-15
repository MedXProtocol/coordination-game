pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract Work {
  ERC20 public token;
  address[] private stakers;
  uint256 public requiredStake;
  mapping (address => bool) public addressStaked;
  mapping (address => uint256) private stakerIndex;

  constructor (ERC20 _token, uint256 _requiredStake) public {
    require(_token != address(0), 'token is defined');
    require(_requiredStake > 0, 'stake is greater than zero');
    token = _token;
    requiredStake = _requiredStake;
  }

  function depositStake() public hasNotStaked(msg.sender) {
    uint256 index = stakers.push(msg.sender) - 1;
    stakerIndex[msg.sender] = index;
    addressStaked[msg.sender] = true;
    require(token.allowance(msg.sender, address(this)) >= requiredStake, 'allowance is sufficient');
    token.transferFrom(msg.sender, address(this), requiredStake);
  }

  function withdrawStake() public hasStaked(msg.sender) {
    addressStaked[msg.sender] = false;
    uint256 index = stakerIndex[msg.sender];
    uint256 lastIndex = stakers.length - 1;
    if (index != lastIndex) {
      address lastStaker = stakers[lastIndex];
      stakers[index] = lastStaker;
      stakerIndex[lastStaker] = index;
    }
    stakers.length--;
    token.transfer(msg.sender, requiredStake);
  }

  function selectWorker(uint256 randomValue) public view returns (address) {
    uint256 index = randomValue % stakers.length;
    return stakers[index];
  }

  modifier hasNotStaked(address _staker) {
    require(!addressStaked[_staker], 'Staker has not staked');
    _;
  }

  modifier hasStaked(address _staker) {
    require(addressStaked[_staker], 'Staker has staked');
    _;
  }
}
