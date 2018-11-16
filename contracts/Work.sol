pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-eth/contracts/ownership/Ownable.sol";
import "./IndexedAddressArray.sol";
import "./TILRoles.sol";

// TODO: This contract needs events!

contract Work is Ownable {
  using IndexedAddressArray for IndexedAddressArray.Data;
  using SafeMath for uint256;

  IERC20 public token;
  TILRoles public roles;

  IndexedAddressArray.Data stakers;
  IndexedAddressArray.Data suspendedStakers;

  uint256 public requiredStake;
  uint256 public jobStake;

  mapping (address => uint256) public balances;

  modifier onlyJobManager() {
    require(roles.hasRole(msg.sender, uint(TILRoles.All.JOB_MANAGER)), "sender is job manager");
    _;
  }

  event SettingsUpdated(
    uint256 applicationStakeAmount,
    uint256 jobStake
  );

  modifier hasNotStaked(address _staker) {
    require(!isStaker(_staker), 'Staker has not staked');
    _;
  }

  modifier hasStaked(address _staker) {
    require(isStaker(_staker), 'Staker has staked');
    _;
  }

  function init (
    address _owner,
    IERC20 _token,
    uint256 _requiredStake,
    uint256 _jobStake,
    TILRoles _roles
  ) public initializer {
    require(_token != address(0), '_token is defined');
    require(_requiredStake > 0, '_requiredStake is greater than zero');
    require(_jobStake > 0, '_jobStake is greater than zero');
    require(_roles != address(0), '_roles is defined');
    Ownable.initialize(_owner);
    token = _token;
    requiredStake = _requiredStake;
    jobStake = _jobStake;
    roles = _roles;
  }

  function depositStake() public {
    require(token.allowance(msg.sender, address(this)) >= requiredStake, 'allowance is sufficient');
    token.transferFrom(msg.sender, address(this), requiredStake);
    balances[msg.sender] = balances[msg.sender].add(requiredStake);
    if (!stakers.hasAddress(msg.sender)) {
      stakers.pushAddress(msg.sender);
    }
    if (suspendedStakers.hasAddress(msg.sender)) {
      suspendedStakers.removeAddress(msg.sender);
    }
  }

  function withdrawStake() public {
    if (stakers.hasAddress(msg.sender)) {
      stakers.removeAddress(msg.sender);
    }
    if (suspendedStakers.hasAddress(msg.sender)) {
      suspendedStakers.removeAddress(msg.sender);
    }
    uint256 amount = balances[msg.sender];
    balances[msg.sender] = 0;
    token.transfer(msg.sender, amount);
  }

  function withdrawJobStake(address _worker) external onlyJobManager returns (bool) {
    require(balances[_worker] >= jobStake, 'worker has enough stake for job');
    balances[_worker] = balances[_worker].sub(jobStake);
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
    balances[_worker] = balances[_worker].add(jobStake);
    if (balances[_worker] >= jobStake) {
      if (suspendedStakers.hasAddress(_worker)) {
        suspendedStakers.removeAddress(_worker);
        stakers.pushAddress(_worker);
      }
    }
  }

  function selectWorker(uint256 randomValue) public view returns (address) {
    uint256 index = randomValue % stakers.addresses.length;
    return stakers.addresses[index];
  }

  function isStaker(address _staker) public view returns (bool) {
    return isActive(_staker) || isSuspended(_staker);
  }

  function isActive(address _staker) public view returns (bool) {
    return stakers.hasAddress(_staker);
  }

  function isSuspended(address _staker) public view returns (bool) {
    return suspendedStakers.hasAddress(_staker);
  }

  function updateSettings(uint256 _requiredStake, uint256 _jobStake) public onlyOwner {
    require(_requiredStake > 0, '_requiredStake is greater than zero');
    require(_jobStake > 0, '_jobStake is greater than zero');

    requiredStake = _requiredStake;
    jobStake = _jobStake;

    emit SettingsUpdated(requiredStake, jobStake);
  }

  function getVerifiersCount() external view returns (uint256 verifiersCount) {
    return stakers.addresses.length;
  }

  function getVerifierByIndex(uint256 index) external view returns (address verifierAddress) {
    if (stakers.addresses.length > 0) {
      return stakers.addressAtIndex(index);
    } else {
      return address(0);
    }
  }
}
