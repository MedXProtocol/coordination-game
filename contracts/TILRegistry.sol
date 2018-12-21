pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "./IndexedBytes32Array.sol";
import "./Work.sol";
import "./PowerChallenge.sol";
import "./CoordinationGame.sol";
import "./TILRoles.sol";
import "zos-lib/contracts/Initializable.sol";

contract TILRegistry is Initializable {
  using IndexedBytes32Array for IndexedBytes32Array.Data;
  using SafeMath for uint256;

  struct Listing {
    address owner;  // Owner of Listing
    uint deposit;   // Number of tokens staked in the listing
    bytes32 secret; // Token address
    bytes hint;     // Token description
  }

  struct CoordinationGameEtherDeposit {
    address verifier;
    uint256 rewardWei;
  }

  event NewListing(address owner, bytes32 listingHash);
  event ListingWithdrawn(address owner, bytes32 listingHash);
  event ListingRemoved(address owner, bytes32 listingHash);

  mapping(bytes32 => Listing) public listings;
  IndexedBytes32Array.Data listingsIterator;
  IERC20 public token;
  TILRoles roles;
  Work work;
  PowerChallenge powerChallenge;
  mapping(bytes32 => CoordinationGameEtherDeposit) public deposits;
  CoordinationGame coordinationGame;

  mapping (address => IndexedBytes32Array.Data) ownerListingIndices;

  modifier onlyJobManager(address _address) {
    require(roles.hasRole(_address, uint(TILRoles.All.JOB_MANAGER)), "only the job manager");
    _;
  }

  modifier onlyTokenMinter() {
    require(roles.hasRole(msg.sender, uint(TILRoles.All.TOKEN_MINTER)), "only the token minter");
    _;
  }

  modifier onlyCompleted(bytes32 _listingHash) {
    require(powerChallenge.isComplete(_listingHash), 'listing has no open challenges');
    _;
  }

  function initialize(address _token, address _roles, address _work, address _powerChallenge) public initializer {
    require(_token != address(0), 'token is defined');
    require(_roles != address(0), 'roles is defined');
    require(_work != address(0), 'work is defined');
    require(_powerChallenge != address(0), 'powerChallenge is defined');
    roles = TILRoles(_roles);
    token = IERC20(_token);
    work = Work(_work);
    powerChallenge = PowerChallenge(_powerChallenge);
  }

  function setCoordinationGame(address _coordinationGame) external onlyTokenMinter onlyJobManager(_coordinationGame) {
    coordinationGame = CoordinationGame(_coordinationGame);
    require(coordinationGame.tilRegistry() == address(this), 'CoordinationGame is bound to this registry');
  }

  function applicantWonCoordinationGame(
    bytes32 _listingHash,
    address _applicant,
    uint256 _deposit,
    bytes32 _secret,
    bytes _hint
  ) external onlyJobManager(msg.sender) {
    createNewListing(_applicant, _listingHash, _deposit, _secret, _hint);
    require(token.transferFrom(msg.sender, address(this), _deposit));
  }

  function applicantLostCoordinationGame(
    bytes32 _listingHash,
    address _applicant,
    uint256 _applicantDepositTokens,
    bytes32 _secret,
    bytes _hint,
    uint256 _rewardWei,
    address _challenger,
    uint256 _challengerDepositTokens
  ) external payable onlyJobManager(msg.sender) {
    require(msg.value == _rewardWei, 'ether has been sent');
    createNewListing(_applicant, _listingHash, _applicantDepositTokens, _secret, _hint);
    require(token.transferFrom(msg.sender, address(this), _applicantDepositTokens.add(_challengerDepositTokens)));
    token.approve(address(powerChallenge), _applicantDepositTokens.add(_challengerDepositTokens));
    powerChallenge.managerAddUserChallenge(_applicant, _listingHash);
    powerChallenge.startApproval(_listingHash, _applicantDepositTokens);
    powerChallenge.challengeFrom(_listingHash, address(this), _challenger);
    deposits[_listingHash] = CoordinationGameEtherDeposit(_challenger, _rewardWei);
  }

  function challenge(bytes32 _listingHash) external onlyCompleted(_listingHash) {
    Listing storage _listing = listings[_listingHash];
    uint256 challengeDeposit = _listing.deposit.mul(2);
    token.transferFrom(msg.sender, address(this), challengeDeposit);
    token.approve(address(powerChallenge), _listing.deposit.add(challengeDeposit));
    powerChallenge.managerAddUserChallenge(_listing.owner, _listingHash);
    powerChallenge.startApproval(_listingHash, _listing.deposit);
    powerChallenge.challengeFrom(_listingHash, address(this), msg.sender);
  }

  function withdrawFromChallenge(bytes32 _listingHash) external {
    Listing storage listing = listings[_listingHash];

    // First withdraw for the registry
    if (powerChallenge.totalWithdrawal(_listingHash, this) > 0) {
      // We make sure to reward the listing owner with the winnings, less their deposit
      uint256 ownerReward = powerChallenge.withdraw(_listingHash) - listing.deposit;
      if (ownerReward > 0) {
        token.transfer(listing.owner, ownerReward);
      }
    }
    // Withdraw normally from the challenge
    powerChallenge.withdrawFor(_listingHash, msg.sender);
    withdrawFromLostCoordinationGame(_listingHash, msg.sender);
    PowerChallenge.State state = powerChallenge.getState(_listingHash);

    if (state == PowerChallenge.State.CHALLENGE_SUCCESS) {
      makeListingInactive(_listingHash);
    }

    if (powerChallenge.isComplete(_listingHash)) {
      powerChallenge.removeChallenge(_listingHash);

      if (state == PowerChallenge.State.CHALLENGE_SUCCESS) {
        removeListing(listing, _listingHash);
        emit ListingRemoved(listing.owner, _listingHash);
      }
    }
  }

  function removeListing(Listing _listing, bytes32 _listingHash) internal {
    makeListingInactive(_listingHash);
    delete listings[_listingHash];

    coordinationGame.removeApplication(_listingHash);

    ownerListingIndices[_listing.owner].removeValue(_listingHash);
  }

  function makeListingInactive(bytes32 _listingHash) internal {
    if (listingsIterator.hasValue(_listingHash)) {
      listingsIterator.removeValue(_listingHash);
    }
  }

  function withdrawFromLostCoordinationGame(bytes32 _listingHash, address _beneficiary) internal {
    PowerChallenge.State state = powerChallenge.getState(_listingHash);
    CoordinationGameEtherDeposit storage deposit = deposits[_listingHash];
    uint256 withdrawal = 0;
    if (state == PowerChallenge.State.CHALLENGE_FAIL && _beneficiary == listings[_listingHash].owner) {
      withdrawal = deposit.rewardWei;
      deposit.rewardWei = 0;
    } else if (state == PowerChallenge.State.CHALLENGE_SUCCESS && _beneficiary == deposit.verifier) {
      withdrawal = deposit.rewardWei;
      deposit.rewardWei = 0;
    }
    if (withdrawal > 0) {
      _beneficiary.transfer(withdrawal);
    }
  }

  function totalChallengeReward(bytes32 _listingHash, address _beneficiary) public view returns (uint256) {
    uint256 reward = powerChallenge.totalWithdrawal(_listingHash, _beneficiary);
    if (_beneficiary == listings[_listingHash].owner) {
      uint256 approveReward = powerChallenge.totalWithdrawal(_listingHash, this);
      if (approveReward > listings[_listingHash].deposit) {
        reward += approveReward - listings[_listingHash].deposit;
      }
    }
    return reward;
  }

  function createNewListing(address _applicant, bytes32 _listingHash, uint256 _deposit, bytes32 _secret, bytes _hint) internal {
    require(!appWasMade(_listingHash), "application was not made");

    // Sets owner
    listings[_listingHash] = Listing(
      _applicant,
      _deposit,
      _secret,
      _hint
    );

    ownerListingIndices[_applicant].pushValue(_listingHash);

    listingsIterator.pushValue(_listingHash);
    emit NewListing(_applicant, _listingHash);
  }

  function withdrawListing(bytes32 _listingHash) external onlyCompleted(_listingHash) {
    Listing storage listing = listings[_listingHash];
    require(msg.sender == listing.owner, 'sender is the listing owner');
    require(listingsIterator.hasValue(_listingHash), 'listing is listingsIterator');

    uint256 stake = listing.deposit;

    removeListing(listing, _listingHash);

    token.transfer(msg.sender, stake);

    emit ListingWithdrawn(msg.sender, _listingHash);
  }

  function () public payable {}

  /**
  @dev                Returns true if apply was called for this listingHash
  @param _listingHash The listingHash whose status is to be examined
  */
  function appWasMade(bytes32 _listingHash) public view returns (bool) {
    return listings[_listingHash].owner != address(0);
  }

  function listingsLength() public view returns (uint) {
    return listingsIterator.length();
  }

  function listingAt(uint256 _index) public view returns (bytes32) {
    return listingsIterator.valueAtIndex(_index);
  }

  function setPowerChallenge(PowerChallenge _powerChallenge) public onlyTokenMinter {
    powerChallenge = _powerChallenge;
  }

  function listingExists(bytes32 _listingHash) public view returns (bool) {
    return (listings[_listingHash].owner != address(0));
  }

  /**
   * @notice Returns the number of listings are owned by the address
   * @param _owner The owner of the listings
   */
  function getOwnerListingsCount(address _owner) external view returns (uint256) {
    return ownerListingIndices[_owner].length();
  }

  /**
   * @notice Return owner's listing hash of a registry listing. (ie. the listing id for
   * their fourth listing can be looked up by passing the owner address and '3'.
   * @param _owner The owner of the listing
   * @param _index The index of the listing
   */
  function getOwnerListingAtIndex(address _owner, uint256 _index)
    external view returns (bytes32)
  {
    return ownerListingIndices[_owner].valueAtIndex(_index);
  }

}
