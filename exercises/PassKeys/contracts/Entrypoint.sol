// contracts/EntryPoint.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EntryPoint {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function setOwner(address _owner) external {
        require(msg.sender == owner, "Only owner can set");
        owner = _owner;
    }
}

