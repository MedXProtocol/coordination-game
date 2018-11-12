pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./IndexedBytes32Array.sol";
import "./Work.sol";
import "./TILRoles.sol";

contract TILRegistry is Ownable {
  using IndexedBytes32Array for IndexedBytes32Array.Data;

  event NewListing(address applicant, bytes32 listingHash);
  event NewListingRequested(address applicant, bytes32 listingHash);

  struct Listing {
      address owner;          // Owner of Listing
      uint unstakedDeposit;   // Number of tokens staked in the listing
  }

  mapping(bytes32 => Listing) public listings;
  IndexedBytes32Array.Data listed;
  IndexedBytes32Array.Data requested;
  ERC20 public token;
  TILRoles roles;
  Work work;

  modifier onlyJobManager() {
    require(roles.hasRole(msg.sender, uint(TILRoles.All.JOB_MANAGER)), "only the job manager");
    _;
  }

  constructor(ERC20 _token, TILRoles _roles, Work _work) public {
    require(_token != address(0), 'token is defined');
    require(_roles != address(0), 'roles is defined');
    require(_work != address(0), 'work is defined');
    roles = _roles;
    token = _token;
    work = _work;
  }

  function newListing(address _applicant, bytes32 _listingHash, uint256 _deposit) external onlyJobManager {
    createNewListing(msg.sender, _applicant, _listingHash, _deposit);
    listed.pushValue(_listingHash);
    emit NewListing(_applicant, _listingHash);
  }

  function requestNewListing(address _applicant, bytes32 _listingHash, uint256 _deposit) external onlyJobManager {
    createNewListing(msg.sender, _applicant, _listingHash, _deposit);
    requested.pushValue(_listingHash);
    emit NewListingRequested(_applicant, _listingHash);
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
  }

  /**
  @dev                Returns true if apply was called for this listingHash
  @param _listingHash The listingHash whose status is to be examined
  */
  function appWasMade(bytes32 _listingHash) public view returns (bool) {
    return listings[_listingHash].owner != address(0);
  }

  function listingsLength() public view returns (uint) {
    return listed.length();
  }

  function listingAt(uint256 _index) public view returns (bytes32) {
    return listed.valueAtIndex(_index);
  }

  function isListed(bytes32 _listingHash) public view returns (bool) {
    return listed.hasValue(_listingHash);
  }

  function isRequested(bytes32 _listingHash) public view returns (bool) {
    return requested.hasValue(_listingHash);
  }
}
