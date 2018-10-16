pragma solidity ^0.4.24;

import "./CoordinationGame.sol";
import "./TILRegistry.sol";
import "./Work.sol";

contract CoordinationGameFactory {
  event CoordinationGameCreated(address sender, address coordinationGame);

  function createCoordinationGame(
    Work _work,
    TILRegistry _tilRegistry
  )
    external
    returns (address)
  {
    CoordinationGame coordinationGame = new CoordinationGame();
    coordinationGame.init(_work, _tilRegistry);

    emit CoordinationGameCreated(msg.sender, address(coordinationGame));

    return coordinationGame;
  }
}
