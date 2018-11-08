pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "tcr/Registry.sol";
import "./CoordinationGame.sol";
import "./IndexedBytes32Array.sol";
import "./TILRoles.sol";

contract TILRegistry is Registry, Ownable {
  using IndexedBytes32Array for IndexedBytes32Array.Data;

  TILRoles roles;
  IndexedBytes32Array.Data listingHashes;

  modifier onlyJobManager() {
    require(roles.hasRole(msg.sender, uint(TILRoles.All.JOB_MANAGER)), "only the job manager");
    _;
  }

  modifier doNotCall() {
    require(false, "you cannot call");
    _;
  }

  function init(address _token, address _voting, address _parameterizer, string _name, TILRoles _roles) public {
    Registry.init(_token, _voting, _parameterizer, _name);
    roles = _roles;
  }

  function apply(bytes32 _listingHash, uint _amount, string _data) external doNotCall {}

  /**
  @notice Allows the CoordinationGame to register new applicants
  @param _applicant The applicant
  @param _listingHash The application id cast to bytes32
  @param _amount The number of tokens the applicant has staked
  @param _data Extra data
  */
  function apply(address _applicant, bytes32 _listingHash, uint _amount, string _data) external onlyJobManager {
    require(!isWhitelisted(_listingHash), "listingHash is not whitelisted");
    require(!appWasMade(_listingHash), "application was not made");
    require(_amount >= parameterizer.get("minDeposit"), "amount is greater or equal to min");

    // Sets owner
    Listing storage listing = listings[_listingHash];
    listing.owner = _applicant;
    listingHashes.pushValue(_listingHash);

    // Sets apply stage end time
    listing.applicationExpiry = block.timestamp.add(parameterizer.get("applyStageLen"));
    listing.unstakedDeposit = _amount;

    // Transfers tokens from user to TILRegistry contract
    require(token.transferFrom(msg.sender, this, _amount));

    emit _Application(_listingHash, _amount, listing.applicationExpiry, _data, msg.sender);
  }

  /**
  @dev                Returns true if apply was called for this listingHash
  @param _listingHash The listingHash whose status is to be examined
  */
  function appWasMade(bytes32 _listingHash) public view returns (bool exists) {
      return listings[_listingHash].owner != address(0);
  }

  /**
  @dev                Determines whether the given listingHash be whitelisted.
  @param _listingHash The listingHash whose status is to be examined
  */
  function canBeWhitelisted(bytes32 _listingHash) public view returns (bool) {
      uint challengeID = listings[_listingHash].challengeID;

      // Ensures that the application was made,
      // the application period has ended,
      // the listingHash can be whitelisted,
      // and either: the challengeID == 0, or the challenge has been resolved.
      if (
          appWasMade(_listingHash) &&
          listings[_listingHash].applicationExpiry <= now &&
          !isWhitelisted(_listingHash) &&
          (challengeID == 0 || challenges[challengeID].resolved == true)
      ) { return true; }

      return false;
  }

  function resetListing(bytes32 _listingHash) private {
    Listing storage listing = listings[_listingHash];

    // Emit events before deleting listing to check whether is whitelisted
    if (listing.whitelisted) {
        emit _ListingRemoved(_listingHash);
    } else {
        emit _ApplicationRemoved(_listingHash);
    }

    // Deleting listing to prevent reentry
    address owner = listing.owner;
    uint unstakedDeposit = listing.unstakedDeposit;
    delete listings[_listingHash];

    // Transfers any remaining balance back to the owner
    if (unstakedDeposit > 0){
        require(token.transfer(owner, unstakedDeposit));
    }

    listingHashes.removeValue(_listingHash);
  }

  function listingsLength() public view returns (uint) {
    return listingHashes.length();
  }

  function listingAt(uint256 _index) public view returns (bytes32) {
    return listingHashes.valueAtIndex(_index);
  }
}
