// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@account-abstraction/contracts/core/EntryPoint.sol";
import "@account-abstraction/contracts/interfaces/IAccount.sol";

contract Account is IAccount{
  uint256 public count;
  address public owner;

  constructor (address _owner) {
    owner = _owner;
  }

  function validateUserOp(PackedUserOperation calldata, bytes32, uint256) external pure returns (uint256 validationData){
    return 0;
  }

  function execute() public{
    count++;
  }

}

contract AccountFactory {
  function createAccount(address owner) external returns(address) {
    Account acc = new Account(owner);
    return address(acc);
  }
}
