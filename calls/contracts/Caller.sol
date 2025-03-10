// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProxyContract {
    uint256 public number; 

    function executeDelegateCall(address _logic, uint256 _num) public {
        (bool success, bytes memory data) = _logic.delegatecall(
            abi.encodeWithSignature("setNumber(uint256)", _num)
        );

    }
}
