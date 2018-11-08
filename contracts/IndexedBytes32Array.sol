pragma solidity ^0.4.24;

library IndexedBytes32Array {

  struct Data {
    bytes32[] values;
    mapping(bytes32 => uint256) indices;
  }

  function pushValue(Data storage self, bytes32 _value) internal returns (uint256) {
    uint256 index = self.values.push(_value) - 1;
    self.indices[_value] = index;
    return index;
  }

  function removeValue(Data storage self, bytes32 _value) internal {
    uint256 index = self.indices[_value];
    delete self.indices[_value];
    uint256 lastIndex = self.values.length - 1;
    if (index != lastIndex) {
      bytes32 lastValue = self.values[lastIndex];
      self.values[index] = lastValue;
      self.indices[lastValue] = index;
    }
    self.values.length--;
  }

  function hasValue(Data storage self, bytes32 _value) internal returns (bool) {
    return self.indices[_value] != 0 ||
           (self.values.length > 0 && self.values[0] == _value);
  }

  function valueAtIndex(Data storage self, uint256 _index) internal returns (bytes32) {
    return self.values[_index];
  }

  function length(Data storage self) internal returns (uint256) {
    return self.values.length;
  }
}
