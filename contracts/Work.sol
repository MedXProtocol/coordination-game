pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './IndexedAddressArray.sol';

contract Work is Ownable {
  using IndexedAddressArray for IndexedAddressArray.Data;

  address jobManager;
  ERC20 public token;
  IndexedAddressArray.Data stakers;
  IndexedAddressArray.Data suspendedStakers;
  uint256 public requiredStake;
  uint256 public jobStake;
  mapping (address => uint256) public balances;

  constructor (ERC20 _token, uint256 _requiredStake, uint256 _jobStake) public {
    require(_token != address(0), 'token is defined');
    require(_requiredStake > 0, 'stake is greater than zero');
    token = _token;
    requiredStake = _requiredStake;
    jobStake = _jobStake;
  }

  function setJobManager(address _jobManager) onlyOwner {
    jobManager = _jobManager;
  }

  function depositStake() public {
    require(token.allowance(msg.sender, address(this)) >= requiredStake, 'allowance is sufficient');
    token.transferFrom(msg.sender, address(this), requiredStake);
    deposit(msg.sender, requiredStake);
  }

  function withdrawStake() public hasStaked(msg.sender) {
    if (stakers.hasAddress(msg.sender)) {
      stakers.removeAddress(msg.sender);
    }
    if (suspendedStakers.hasAddress(msg.sender)) {
      suspendedStakers.removeAddress(msg.sender);
    }
    uint256 amount = balances[msg.sender];
    delete balances[msg.sender];
    token.transfer(msg.sender, amount);
  }

  function withdrawJobStake(address _worker) external onlyJobManager returns (bool) {
    require(balances[_worker] >= jobStake, 'worker has enough stake for job');
    balances[_worker] -= jobStake;
    token.transfer(msg.sender, jobStake);
    /// If the new stake amount is below the job amount, suspend them
    if (balances[_worker] < jobStake) {
      stakers.removeAddress(_worker);
      suspendedStakers.pushAddress(_worker);
    }

    return true;
  }

  function depositJobStake(address _worker) external onlyJobManager {
    token.transferFrom(msg.sender, address(this), jobStake);
    deposit(_worker, jobStake);
  }

  function selectWorker(uint256 randomValue) public view returns (address) {
    uint256 index = randomValue % stakers.addresses.length;
    return stakers.addresses[index];
  }

  function isStaker(address _staker) public view returns (bool) {
    return stakers.hasAddress(_staker) || suspendedStakers.hasAddress(_staker);
  }

  function isSuspended(address _staker) public view returns (bool) {
    return suspendedStakers.hasAddress(_staker);
  }

  function deposit(address _worker, uint256 _amount) internal {
    balances[_worker] += _amount;
    if (balances[_worker] >= jobStake) {
      if (suspendedStakers.hasAddress(_worker)) {
        suspendedStakers.removeAddress(_worker);
      }
      if (!stakers.hasAddress(_worker)) {
        stakers.pushAddress(_worker);
      }
    }
  }

  modifier hasNotStaked(address _staker) {
    require(!isStaker(_staker), 'Staker has not staked');
    _;
  }

  modifier hasStaked(address _staker) {
    require(isStaker(_staker), 'Staker has staked');
    _;
  }

  modifier onlyJobManager() {
    require(msg.sender == jobManager, 'sender is job manager');
    _;
  }
}
