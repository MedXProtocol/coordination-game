pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/ownership/Ownable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";
import "./IndexedBytes32Array.sol";
import "./Work.sol";
import "./TILRoles.sol";

contract TILRegistry is Initializable, Ownable {
  using IndexedBytes32Array for IndexedBytes32Array.Data;

  enum ListingState {
      LISTED,
      CHALLENGED,
      APPROVED
  }

  struct Listing {
      address owner;          // Owner of Listing
      uint unstakedDeposit;   // Number of tokens staked in the listing
      ListingState state;
  }

  event NewListing(address owner, bytes32 listingHash, ListingState state);
  event ListingWithdrawn(address owner, bytes32 listingHash);

  mapping(bytes32 => Listing) public listings;
  IndexedBytes32Array.Data listingsIterator;
  ERC20 public token;
  TILRoles roles;
  Work work;

  modifier onlyJobManager() {
    require(roles.hasRole(msg.sender, uint(TILRoles.All.JOB_MANAGER)), "only the job manager");
    _;
  }

  function initialize(ERC20 _token, TILRoles _roles, Work _work) public initializer {
    require(_token != address(0), 'token is defined');
    require(_roles != address(0), 'roles is defined');
    require(_work != address(0), 'work is defined');
    Ownable.initialize(msg.sender);
    roles = _roles;
    token = _token;
    work = _work;
  }

  function newListing(address _applicant, bytes32 _listingHash, uint256 _deposit) external onlyJobManager {
    createNewListing(msg.sender, _applicant, _listingHash, _deposit, ListingState.LISTED);
  }

  function newListingChallenge(address _applicant, bytes32 _listingHash, uint256 _deposit) external onlyJobManager {
    createNewListing(msg.sender, _applicant, _listingHash, _deposit, ListingState.CHALLENGED);
  }

  function createNewListing(address _sender, address _applicant, bytes32 _listingHash, uint256 _deposit, ListingState state) internal {
    require(!appWasMade(_listingHash), "application was not made");
    require(_deposit >= work.jobStake(), "amount is greater or equal to min");

    // Sets owner
    Listing storage listing = listings[_listingHash];
    listing.owner = _applicant;
    listing.state = state;

    // Sets apply stage end time
    listing.unstakedDeposit = _deposit;

    // Transfers tokens from user to TILRegistry contract
    require(token.transferFrom(_sender, this, _deposit));

    listingsIterator.pushValue(_listingHash);
    emit NewListing(_applicant, _listingHash, state);
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
}
