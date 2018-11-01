pragma solidity ^0.4.24;

import "./CoordinationGame.sol";
import "./TILRegistry.sol";
import "./Work.sol";

contract CoordinationGameFactory {
  event CoordinationGameCreated(address sender, address coordinationGame);

  function createCoordinationGame(
    Work _work,
    TILRegistry _tilRegistry,
    address _owner,
    uint256 _applicationStakeAmount
  )
    external
    returns (address)
  {
    CoordinationGame coordinationGame = new CoordinationGame();
    coordinationGame.init(_work, _tilRegistry, _applicationStakeAmount);
    coordinationGame.transferOwnership(_owner);

    emit CoordinationGameCreated(msg.sender, address(coordinationGame));

    return coordinationGame;
  }
}
