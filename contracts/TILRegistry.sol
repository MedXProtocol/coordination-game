pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";
import "./IndexedBytes32Array.sol";
import "./Work.sol";
import "./PowerChallenge.sol";
import "./IPowerChallengeResult.sol";
import "./TILRoles.sol";
import "zos-lib/contracts/Initializable.sol";

contract TILRegistry is Initializable, IPowerChallengeResult {
  using IndexedBytes32Array for IndexedBytes32Array.Data;

  struct Listing {
    address owner;          // Owner of Listing
    uint unstakedDeposit;   // Number of tokens staked in the listing
  }

  event NewListing(address owner, bytes32 listingHash);
  event ListingWithdrawn(address owner, bytes32 listingHash);

  mapping(bytes32 => Listing) public listings;
  IndexedBytes32Array.Data listingsIterator;
  IERC20 public token;
  TILRoles roles;
  Work work;
  PowerChallenge powerChallenge;

  modifier onlyJobManager() {
    require(roles.hasRole(msg.sender, uint(TILRoles.All.JOB_MANAGER)), "only the job manager");
    _;
  }

  modifier onlyTokenMinter() {
    require(roles.hasRole(msg.sender, uint(TILRoles.All.TOKEN_MINTER)), "only the token minter");
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

  function applicantWonCoordinationGame(bytes32 _listingHash, address _applicant, uint256 _deposit) external onlyJobManager {
    createNewListing(msg.sender, _applicant, _listingHash, _deposit);
  }

  function applicantLostCoordinationGame(
    bytes32 _listingHash,
    address _applicant, uint256 _applicantDepositTokens, uint256 _applicantDepositEther,
    address _challenger, uint256 _challengerDepositTokens
  ) external onlyJobManager {
    createNewListing(msg.sender, _applicant, _listingHash, _applicantDepositTokens);
    powerChallenge.startChallenge(_listingHash);
  }

  function challengeSucceeded(bytes32 _listingHash) {

  }

  function challengeFailed(bytes32 _listingHash) {

  }

  function createNewListing(address _sender, address _applicant, bytes32 _listingHash, uint256 _deposit) internal {
    require(!appWasMade(_listingHash), "application was not made");
    require(_deposit >= work.jobStake(), "amount is greater or equal to min");

    // Sets owner
    Listing storage listing = listings[_listingHash];
    listing.owner = _applicant;

    // Sets apply stage end time
    listing.unstakedDeposit = _deposit;

    // Transfers tokens from user to TILRegistry contract
    require(token.transferFrom(_sender, this, _deposit));

    listingsIterator.pushValue(_listingHash);
    emit NewListing(_applicant, _listingHash);
  }

  function withdrawListing(bytes32 _listingHash) external {
    Listing storage listing = listings[_listingHash];
    require(msg.sender == listing.owner, 'sender is the listing owner');
    require(listingsIterator.hasValue(_listingHash), 'listing is listingsIterator');
    listingsIterator.removeValue(_listingHash);
    uint256 stake = listing.unstakedDeposit;
    delete listings[_listingHash];
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
}
