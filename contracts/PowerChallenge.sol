pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/ownership/Ownable.sol";
import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "./TILRegistry.sol";
import "./IndexedBytes32Array.sol";
import "./IPowerChallenge.sol";

contract PowerChallenge is Ownable, IPowerChallenge {
  using SafeMath for uint256;
  using IndexedBytes32Array for IndexedBytes32Array.Data;

  enum State {
      BLANK,
      CHALLENGED,
      APPROVED,
      CHALLENGE_FAIL,
      CHALLENGE_SUCCESS
  }

  struct Challenge {
    bytes32 id;
    uint256 round;
    uint256 challengeTotal;
    uint256 approveTotal;
    uint256 updatedAt;
    State state;
    mapping(address => uint256) challengeDeposits;
    mapping(address => uint256) approveDeposits;
  }

  event ChallengeStarted(bytes32 id, State state);
  event Approved(bytes32 id);
  event Challenged(bytes32 id);
  event Closed(bytes32 id);
  event Withdrew(bytes32 id, address recipient, uint256 amount);

  IERC20 public token;
  uint256 public timeout;
  mapping(bytes32 => Challenge) public challenges;
  IndexedBytes32Array.Data challengeIterator;

  modifier onlyNotStarted(bytes32 _id) {
    require(notStarted(_id), "challenge not started");
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

  modifier notTimedOut(bytes32 _id) {
    require(!isTimedOut(_id), 'challenge has not timed out');
    _;
  }

  modifier onlyTimedOut(bytes32 _id) {
    require(isTimedOut(_id), 'challenge has timed out');
    _;
  }

  function init(
    address _owner, IERC20 _token, uint256 _timeout
  ) public initializer {
    require(_owner != address(0), 'owner is defined');
    require(_token != address(0), 'token is defined');
    require(_timeout > 0, '_timeout must be greater than zero');
    Ownable.initialize(_owner);
    token = _token;
    timeout = _timeout;
  }

  function startChallenge(bytes32 _id, uint256 _amount) external {
    startChallengeFrom(_id, _amount, msg.sender, msg.sender);
  }

  /**
    * @notice Starts a challenge.  The tokens come from the _payer and are denoted as belonging to the _beneficiary.
    * @param _id The listing hash
    * @param _amount The amount to start the challenge with
    * @param _payer The address that is paying the tokens
    * @param _beneficiary The address that will be able to withdraw these tokens.
    */
  function startChallengeFrom(bytes32 _id, uint256 _amount, address _payer, address _beneficiary) public onlyNotStarted(_id) {
    require(token.transferFrom(_payer, address(this), _amount), 'transferred tokens');
    challenges[_id] = Challenge(
      _id,
      0,
      _amount,
      0,
      block.timestamp,
      State.CHALLENGED
    );
    challenges[_id].challengeDeposits[_beneficiary] = _amount;
    challengeIterator.pushValue(_id);

    emit ChallengeStarted(_id, challenges[_id].state);
  }

  function startApproval(bytes32 _id, uint256 _amount) external {
    startApprovalFrom(_id, _amount, msg.sender, msg.sender);
  }

  /**
    * @notice Starts an approval.  Really only used by the TILRegistry. The tokens come from the _payer and are denoted as belonging to the _beneficiary.
    * @param _id The listing hash
    * @param _amount The amount to start the approval with
    * @param _payer The address that is paying the tokens
    * @param _beneficiary The address that will be able to withdraw these tokens.
    */
  function startApprovalFrom(bytes32 _id, uint256 _amount, address _payer, address _beneficiary) public onlyNotStarted(_id) {
    require(token.transferFrom(_payer, address(this), _amount), 'transferred tokens');
    challenges[_id] = Challenge(
      _id,
      0,
      0,
      _amount,
      block.timestamp,
      State.APPROVED
    );
    challenges[_id].approveDeposits[_beneficiary] = _amount;
    challengeIterator.pushValue(_id);

    emit ChallengeStarted(_id, challenges[_id].state);
  }

  function approve(bytes32 _id) external {
    approveFrom(_id, msg.sender, msg.sender);
  }

  function approveFrom(bytes32 _id, address _payer, address _beneficiary) public isChallenged(_id) notTimedOut(_id) {
    Challenge storage challengeStore = challenges[_id];
    uint256 deposit = nextRound(_id, _payer);
    challengeStore.approveTotal = challengeStore.approveTotal.add(deposit);
    challengeStore.approveDeposits[_beneficiary] = challengeStore.approveDeposits[_beneficiary].add(deposit);
    challengeStore.state = State.APPROVED;

    emit Approved(_id);
  }

  /**
    * @notice Starts or continues a challenge against a key.
    * @param _id The challenge id
    */
  function challenge(bytes32 _id) external {
    challengeFrom(_id, msg.sender, msg.sender);
  }

  function challengeFrom(bytes32 _id, address _payer, address _beneficiary) public isApproved(_id) notTimedOut(_id) {
    Challenge storage challengeStore = challenges[_id];
    uint256 deposit = nextRound(_id, _payer);
    challengeStore.challengeTotal = challengeStore.challengeTotal.add(deposit);
    challengeStore.challengeDeposits[_beneficiary] = challengeStore.challengeDeposits[_beneficiary].add(deposit);
    challengeStore.state = State.CHALLENGED;

    emit Challenged(_id);
  }

  function close(bytes32 _id) internal onlyTimedOut(_id) {
    Challenge storage challengeStore = challenges[_id];
    challengeStore.state = winningState(_id);
    challengeStore.updatedAt = block.timestamp;

    emit Closed(_id);
  }

  function withdraw(bytes32 _id) external {
    withdrawFor(_id, msg.sender);
  }

  function withdrawFor(bytes32 _id, address _beneficiary) public {
    if (!isComplete(_id)) {
      close(_id);
    }
    Challenge storage challengeStore = challenges[_id];
    uint256 withdrawal;
    if (challengeStore.state == State.CHALLENGE_FAIL) {
      withdrawal = totalApproveWithdrawal(_id, _beneficiary);
      challengeStore.approveDeposits[_beneficiary] = 0;
    } else if (challengeStore.state == State.CHALLENGE_SUCCESS) {
      withdrawal = totalChallengeWithdrawal(_id, _beneficiary);
      challengeStore.challengeDeposits[_beneficiary] = 0;
    }
    token.transfer(_beneficiary, withdrawal);

    emit Withdrew(_id, _beneficiary, withdrawal);
  }

  function nextDepositAmount(bytes32 _id) public view returns (uint256) {
    Challenge storage challengeStore = challenges[_id];
    return challengeStore.challengeTotal.add(challengeStore.approveTotal).mul(2);
  }

  function nextRound(bytes32 _id, address _payer) internal returns (uint256) {
    Challenge storage challengeStore = challenges[_id];
    uint256 deposit = nextDepositAmount(_id);
    require(token.transferFrom(_payer, address(this), deposit), 'transferred tokens');
    challengeStore.round = challengeStore.round.add(1);
    challengeStore.updatedAt = block.timestamp;
    return deposit;
  }

  function isTimedOut(bytes32 _id) public view returns (bool) {
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

  function isComplete(bytes32 _id) public view returns (bool) {
    State state = challenges[_id].state;
    return state == State.CHALLENGE_SUCCESS || state == State.CHALLENGE_FAIL;
  }

  function getState(bytes32 _id) public view returns (State) {
    return challenges[_id].state;
  }

  function challengeCount() public view returns (uint256) {
    return challengeIterator.length();
  }

  function challengeAt(uint256 index) public view returns (bytes32) {
    return challengeIterator.valueAtIndex(index);
  }

  function notStarted(bytes32 _id) public view returns (bool) {
    State state = challenges[_id].state;
    return state == State.BLANK || state == State.CHALLENGE_FAIL || state == State.CHALLENGE_SUCCESS;
  }

  function winningState(bytes32 _id) public view returns (State) {
    State state;
    Challenge storage challengeStore = challenges[_id];
    if (challengeStore.challengeTotal > challengeStore.approveTotal) {
      state = State.CHALLENGE_SUCCESS;
    } else {
      state = State.CHALLENGE_FAIL;
    }
    return state;
  }

  function totalDeposit(bytes32 _id, address _user) public view returns (uint256) {
    Challenge storage challengeStore = challenges[_id];
    return challengeStore.challengeDeposits[_user] + challengeStore.approveDeposits[_user];
  }

  function totalWithdrawal(bytes32 _id, address _user) external view returns (uint256) {
    uint256 withdrawal;
    State state = winningState(_id);
    if (state == State.CHALLENGE_FAIL) {
      withdrawal = totalApproveWithdrawal(_id, _user);
    } else if (state == State.CHALLENGE_SUCCESS) {
      withdrawal = totalChallengeWithdrawal(_id, _user);
    }
    return withdrawal;
  }

  function totalChallengeWithdrawal(bytes32 _id, address _user) public view returns (uint256) {
    Challenge storage _challenge = challenges[_id];
    uint256 total = _challenge.challengeTotal.add(_challenge.approveTotal);
    return total.mul(_challenge.challengeDeposits[_user]).div(_challenge.challengeTotal);
  }

  function totalApproveWithdrawal(bytes32 _id, address _user) public view returns (uint256) {
    Challenge storage _challenge = challenges[_id];
    uint256 total = _challenge.challengeTotal.add(_challenge.approveTotal);
    return total.mul(_challenge.approveDeposits[_user]).div(_challenge.approveTotal);
  }
}
