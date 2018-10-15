pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { Registry as TCR } from 'tcr/Registry.sol';
import "./CoordinationGame.sol";

contract Registry is TCR, Ownable {
  CoordinationGame public coordinationGame;

  modifier onlyCoordinationGame() {
    require(msg.sender == address(coordinationGame), 'only the Coordination Game can apply');
    _;
  }

  function setCoordinationGame(address _coordinationGame) external onlyOwner {
    coordinationGame = CoordinationGame(_coordinationGame);
  }

  /**
  @notice Allows the CoordinationGame to registry new applicants
  @param _listingHash The address of the applicant cast to bytes32
  @param _amount The number of tokens the applicant has staked
  @param _data Extra data
  */
  function apply(bytes32 _listingHash, uint _amount, string _data) external onlyCoordinationGame {
    require(!isWhitelisted(_listingHash));
    require(!appWasMade(_listingHash));
    require(_amount >= parameterizer.get("minDeposit"));

    // Sets owner
    Listing storage listing = listings[_listingHash];
    // The owner is actually the _listingHash
    listing.owner = address(_listingHash);

    // Sets apply stage end time
    listing.applicationExpiry = block.timestamp.add(parameterizer.get("applyStageLen"));
    listing.unstakedDeposit = _amount;

    // Transfers tokens from user to Registry contract
    require(token.transferFrom(listing.owner, this, _amount));

    emit _Application(_listingHash, _amount, listing.applicationExpiry, _data, msg.sender);
  }
}
