pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/ownership/Ownable.sol";
import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "./TILRegistry.sol";

contract PowerChallenge is Ownable {
  using SafeMath for uint256;

  enum State {
      BLANK,
      CHALLENGED,
      APPROVED,
      CHALLENGE_FAIL,
      CHALLENGE_SUCCESS
  }

  struct Challenge {
    bytes32 id;
    uint256 firstChallengeAmount;
    uint256 round;
    uint256 challengeTotal;
    uint256 approveTotal;
    uint256 updatedAt;
    State state;
    mapping(address => uint256) challengeDeposits;
    mapping(address => uint256) approveDeposits;
  }

  event ChallengeStarted(bytes32 id);
  event Approved(bytes32 id);
  event Challenged(bytes32 id);
  event TimedOut(bytes32 id);
  event Withdrawal(bytes32 id, address recipient, uint256 amount);

  uint256 public firstChallengeAmount;
  IERC20 public token;
  uint256 public timeout;
  mapping(bytes32 => Challenge) public challenges;
  TILRegistry registry;

  modifier notStarted(bytes32 _id) {
    State state = challenges[_id].state;
    require(state == State.BLANK || state == State.CHALLENGE_FAIL || state == State.CHALLENGE_SUCCESS, "challenge not started");
    _;
  }

  modifier isApproved(bytes32 _id) {
    require(challenges[_id].state == State.APPROVED, 'state is approved');
    _;
  }

  modifier isChallenged(bytes32 _id) {
    require(challenges[_id].state == State.CHALLENGED, 'state is challenged');
    _;
  }

  modifier isStarted(bytes32 _id) {
    State state = challenges[_id].state;
    require(state == State.APPROVED || state == State.CHALLENGED, 'challenge has started');
    _;
  }

  modifier isComplete(bytes32 _id) {
    State state = challenges[_id].state;
    require(state == State.CHALLENGE_SUCCESS || state == State.CHALLENGE_FAIL, 'challenge is complete');
    _;
  }

  modifier notTimedOut(bytes32 _id) {
    require(!isTimedOut(_id), 'challenge has not timed out');
    _;
  }

  function init(
    address _owner, IERC20 _token, uint256 _firstChallengeAmount, uint256 _timeout, TILRegistry _registry
  ) public initializer {
    require(_owner != address(0), 'owner is defined');
    require(_token != address(0), 'token is defined');
    require(_firstChallengeAmount > 0, 'first deposit cannot be zero');
    require(_registry != address(0), 'registry is defined');
    Ownable.initialize(_owner);
    token = _token;
    firstChallengeAmount = _firstChallengeAmount;
    timeout = _timeout;
  }

  function startChallenge(bytes32 _id) external notStarted(_id) {
    require(token.transferFrom(msg.sender, address(this), firstChallengeAmount), 'transferred tokens');
    challenges[_id] = Challenge(
      _id,
      firstChallengeAmount,
      0,
      firstChallengeAmount,
      0,
      block.timestamp,
      State.CHALLENGED
    );
    challenges[_id].challengeDeposits[msg.sender] = firstChallengeAmount;

    emit ChallengeStarted(_id);
  }

  function approve(bytes32 _id) external isChallenged(_id) notTimedOut(_id) {
    Challenge storage challengeStore = challenges[_id];
    uint256 deposit = nextRound(challengeStore, msg.sender);
    challengeStore.approveTotal = challengeStore.approveTotal.add(deposit);
    challengeStore.approveDeposits[msg.sender] = challengeStore.approveDeposits[msg.sender].add(deposit);
    challengeStore.state = State.APPROVED;

    emit Approved(_id);
  }

  /**
    * @notice Starts or continues a challenge against a key.
    * @param _id The challenge id
    */
  function challenge(bytes32 _id) external isApproved(_id) notTimedOut(_id) {
    Challenge storage challengeStore = challenges[_id];
    uint256 deposit = nextRound(challengeStore, msg.sender);
    challengeStore.challengeTotal = challengeStore.challengeTotal.add(deposit);
    challengeStore.challengeDeposits[msg.sender] = challengeStore.challengeDeposits[msg.sender].add(deposit);
    challengeStore.state = State.CHALLENGED;

    emit Challenged(_id);
  }

  function close(bytes32 _id) external isStarted(_id) {
    require(isTimedOut(_id), 'challenge has timed out');
    Challenge storage challengeStore = challenges[_id];
    if (challengeStore.challengeTotal > challengeStore.approveTotal) {
      challengeStore.state = State.CHALLENGE_SUCCESS;
    } else {
      challengeStore.state = State.CHALLENGE_FAIL;
    }
    challengeStore.updatedAt = block.timestamp;

    emit TimedOut(_id);
  }

  function withdraw(bytes32 _id) external isComplete(_id) {
    Challenge storage challengeStore = challenges[_id];
    uint256 total = challengeStore.challengeTotal.add(challengeStore.approveTotal);
    uint256 withdrawal = 0;
    if (challengeStore.state == State.CHALLENGE_FAIL) {
      withdrawal = total.mul(challengeStore.approveDeposits[msg.sender]).div(challengeStore.approveTotal);
      challengeStore.approveDeposits[msg.sender] = 0;
    } else if (challengeStore.state == State.CHALLENGE_SUCCESS) {
      withdrawal = total.mul(challengeStore.challengeDeposits[msg.sender]).div(challengeStore.challengeTotal);
      challengeStore.challengeDeposits[msg.sender] = 0;
    }
    token.transfer(msg.sender, withdrawal);

    emit Withdrawal(_id, msg.sender, withdrawal);
  }

  function nextRound(Challenge storage challengeStore, address _address) internal returns (uint256) {
    uint256 deposit = nextDepositAmount(challengeStore);
    require(token.transferFrom(_address, address(this), deposit), 'transferred tokens');
    challengeStore.round = challengeStore.round.add(1);
    challengeStore.updatedAt = block.timestamp;
    return deposit;
  }

  function nextDepositAmount(Challenge storage challengeStore) internal view returns (uint256) {
    return challengeStore.firstChallengeAmount.mul(2 ** (challengeStore.round.add(1)));
  }

  function isTimedOut(bytes32 _id) internal view returns (bool) {
    Challenge storage challengeStore = challenges[_id];
    return block.timestamp >= challengeStore.updatedAt.add(timeout);
  }

  function setTimeout(uint256 _timeout) external onlyOwner {
    timeout = _timeout;
  }

  function challengeBalance(bytes32 _id, address _address) external view returns (uint256) {
    return challenges[_id].challengeDeposits[_address];
  }

  function approveBalance(bytes32 _id, address _address) external view returns (uint256) {
    return challenges[_id].approveDeposits[_address];
  }
}
