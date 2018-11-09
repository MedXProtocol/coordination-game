pragma solidity ^0.4.24;

import "./CoordinationGame.sol";
import "./CoordinationGameFactory.sol";
import "./TILRegistry.sol";

contract TILRegistryFactory {
  CoordinationGameFactory public coordinationGameFactory;

  event TILRegistryCreated(address sender, address tilRegistry);

  constructor(CoordinationGameFactory _coordinationGameFactory) public {
    coordinationGameFactory = _coordinationGameFactory;
  }

  function createTILRegistry(
    Parameterizer _parameterizer,
    EtherPriceFeed _etherPriceFeed,
    Work _work,
    string _name,
    uint256 _applicationStakeAmount,
    uint256 _baseApplicationFeeUsdWei
  )
    external
    returns (address)
  {
    TILRegistry tilRegistry = new TILRegistry();
    tilRegistry.init(
      address(_parameterizer.token()),
      address(_parameterizer.voting()),
      address(_parameterizer),
      _name
    );
    emit TILRegistryCreated(msg.sender, address(tilRegistry));

    address coordinationGameAddress = coordinationGameFactory.createCoordinationGame(
      _etherPriceFeed,
      _work,
      tilRegistry,
      msg.sender,
      _applicationStakeAmount,
      _baseApplicationFeeUsdWei
    );
    tilRegistry.setCoordinationGame(coordinationGameAddress);
    tilRegistry.transferOwnership(msg.sender);

    return tilRegistry;
  }
}
