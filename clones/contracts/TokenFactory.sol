// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./GaneToken.sol";

contract TokenFactory {
    address public immutable implementation;
    event TokenCreated(address tokenAddress);

    constructor(address _implementation) {
        implementation = _implementation;
    }

    function createToken(string memory name, string memory symbol) external {
        address clone = Clones.clone(implementation);
        GaneToken(clone).initialize(name, symbol, msg.sender);
        emit TokenCreated(clone);
    }
}
