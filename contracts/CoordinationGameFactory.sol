pragma solidity ^0.4.24;

import "./CoordinationGame.sol";
import "./TILRegistry.sol";
import "./Work.sol";

contract CoordinationGameFactory {
  event CoordinationGameCreated(address sender, address coordinationGame);

  function createCoordinationGame(
    EtherPriceFeed _etherPriceFeed,
    Work _work,
    TILRegistry _tilRegistry,
    address _owner,
    uint256 _applicationStakeAmount,
    uint256 _baseApplicationFeeUsdWei
  )
    external
    returns (address)
  {
    CoordinationGame coordinationGame = new CoordinationGame();
    coordinationGame.init(
      _owner,
      _etherPriceFeed,
      _work,
      _tilRegistry,
      _applicationStakeAmount,
      _baseApplicationFeeUsdWei
    );

    emit CoordinationGameCreated(msg.sender, address(coordinationGame));

    return coordinationGame;
  }
}
