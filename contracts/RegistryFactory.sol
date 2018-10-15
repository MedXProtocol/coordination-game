pragma solidity ^0.4.24;

import "./Registry.sol";
import "./CoordinationGame.sol";

contract RegistryFactory {
  event CreatedRegistry(address sender, address registry);
  event CreatedCoordinationGame(address sender, address coordinationGame);

  function createRegistry(Parameterizer _parameterizer, Work _work, string _name) external returns (address) {
    Registry registry = new Registry();
    registry.init(
      address(_parameterizer.token),
      address(_parameterizer.voting),
      address(_parameterizer),
      _name
    );
    CoordinationGame coordinationGame = new CoordinationGame();
    coordinationGame.init(_work, registry, _parameterizer);
    registry.setCoordinationGame(coordinationGame);

    emit CreatedRegistry(msg.sender, address(registry));
    emit CreatedCoordinationGame(msg.sender, address(coordinationGame));

    return registry;
  }
}
