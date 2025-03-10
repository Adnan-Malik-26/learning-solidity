// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract DemoV2 {
  string public name;

  function version() public pure returns (string memory) {
    return "2.0.0";
  }

  function setName(string memory _name) public {
    name = _name;
  }
}
