// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract SmartAccount {
    address public owner;
    bytes32 private pinHash;

    event TransactionExecuted(address target, uint256 value, bytes data);

    constructor(bytes32 _pinHash) {
        owner = msg.sender;
        pinHash = _pinHash;
    }

    function executeTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 pin
    ) external {
        require(msg.sender == owner, "Not owner");
        require(keccak256(abi.encodePacked(pin)) == pinHash, "Invalid PIN");

        (bool success, ) = target.call{value: value}(data);
        require(success, "Transaction failed");

        emit TransactionExecuted(target, value, data);
    }

    function getOwner() external view returns (address) {
        return owner;
    }
}
