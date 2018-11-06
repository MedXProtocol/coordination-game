pragma solidity ^0.4.24;

library IndexedAddressArray {

  struct Data {
    address[] addresses;
    mapping(address => uint256) indices;
  }

  function pushAddress(Data storage self, address _value) internal returns (uint256) {
    uint256 index = self.addresses.push(_value) - 1;
    self.indices[_value] = index;
    return index;
  }

  function removeAddress(Data storage self, address _value) internal {
    uint256 index = self.indices[_value];
    delete self.indices[_value];
    uint256 lastIndex = self.addresses.length - 1;
    if (index != lastIndex) {
      address lastValue = self.addresses[lastIndex];
      self.addresses[index] = lastValue;
      self.indices[lastValue] = index;
    }
    self.addresses.length--;
  }

  function hasAddress(Data storage self, address _value) internal returns (bool) {
    return self.indices[_value] != 0 ||
           (self.addresses.length > 0 && self.addresses[0] == _value);
  }

  function addressAtIndex(Data storage self, uint256 _index) internal returns (address) {
    return self.addresses[_index];
  }
}
