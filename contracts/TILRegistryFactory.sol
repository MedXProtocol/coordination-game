pragma solidity ^0.4.24;

import "./CoordinationGame.sol";
import "./CoordinationGameFactory.sol";
import "tcr/ParameterizerFactory.sol";
import "./TILRegistry.sol";
import "./TILRoles.sol";
import "tokens/eip20/EIP20.sol";

contract TILRegistryFactory {
  CoordinationGameFactory public coordinationGameFactory;
  ParameterizerFactory public parameterizerFactory;

  event TILRegistryCreated(address sender, address tilRegistry);
  event CoordinationGameCreated(address sender, address coordinationGame);

  constructor(CoordinationGameFactory _coordinationGameFactory, ParameterizerFactory _parameterizerFactory) public {
    coordinationGameFactory = _coordinationGameFactory;
    parameterizerFactory = _parameterizerFactory;
  }

  function createTILRegistryWithParameterizer(
    Parameterizer _parameterizer,
    string _name,
    TILRoles _roles
  )
    public
    returns (address)
  {
    TILRegistry tilRegistry = new TILRegistry();
    tilRegistry.init(
      address(_parameterizer.token()),
      address(_parameterizer.voting()),
      address(_parameterizer),
      _name,
      _roles
    );
    emit TILRegistryCreated(msg.sender, address(tilRegistry));
    tilRegistry.transferOwnership(msg.sender);
    return tilRegistry;
  }

  function createTILRegistry(
    EIP20 _token,
    uint[] _parameters,
    string _name,
    TILRoles _roles
  )
    public
    returns (address)
  {
    Parameterizer parameterizer = parameterizerFactory.newParameterizerBYOToken(_token, _parameters);
    PLCRVoting plcr = parameterizer.voting();

    return createTILRegistryWithParameterizer(parameterizer, _name, _roles);
  }
}
