// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IEntryPoint } from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import { BaseAccount } from "@account-abstraction/contracts/core/BaseAccount.sol";
import { PackedUserOperation } from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

contract PasskeySmartAccount is BaseAccount {
    IEntryPoint private immutable _entryPoint;
    address public owner;

    constructor(IEntryPoint anEntryPoint) {
        _entryPoint = anEntryPoint;
        owner = msg.sender;
    }

    function entryPoint() public view override returns (IEntryPoint) {
        return _entryPoint;
    }

    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) public view override returns (uint256 validationData) {
        if (owner == address(0)) {
            return 1; // invalid
        }
        return 0; // valid
    }

    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view override returns (uint256 validationData) {
        // Dummy validation logic: always succeed
        return 0;
    }

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return interfaceId == type(BaseAccount).interfaceId;
    }
}


