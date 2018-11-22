pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";

contract MockTILRegistry {
  IERC20 public token;

  mapping(bytes32 => bool) public challenges;
  mapping(bytes32 => bool) public approvals;

  struct LostCoordinationGame {
    bytes32 _listingHash;
    address _applicant;
    uint256 _applicantDepositTokens;
    uint256 _rewardWei;
    address _challenger;
    uint256 _challengerDepositTokens;
  }

  mapping(bytes32 => LostCoordinationGame) public lostCoordinationGames;

  constructor(address _token) public {
    require(_token != address(0), 'token is defined');
    token = IERC20(_token);
  }

  function applicantWonCoordinationGame(bytes32 _listingHash, address, uint256) external {
    approvals[_listingHash] = true;
  }

  function applicantLostCoordinationGame(
    bytes32 _listingHash,
    address _applicant, uint256 _applicantDepositTokens, uint256 _rewardWei,
    address _challenger, uint256 _challengerDepositTokens
  ) external payable {
    challenges[_listingHash] = true;
    lostCoordinationGames[_listingHash] = LostCoordinationGame(
      _listingHash,
      _applicant,
      _applicantDepositTokens,
      _rewardWei,
      _challenger,
      _challengerDepositTokens
    );
  }
}
