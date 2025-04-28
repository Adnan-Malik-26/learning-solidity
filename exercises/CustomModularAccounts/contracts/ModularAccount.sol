// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

interface IModule {
    function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash) external returns (uint256 validationData);
}

contract ModularAccount is IAccount {
    address public entryPoint;
    address public owner;

    mapping(address => bool) public modules;

    constructor(address _entryPoint, address _owner) {
        entryPoint = _entryPoint;
        owner = _owner;
    }

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256
    ) external override returns (uint256 validationData) {
        require(msg.sender == entryPoint, "Not from EntryPoint");

        // Recover who signed the userOp
        address signer = recoverSigner(userOpHash, userOp.signature);

        // Check if signer is owner
        if (signer == owner) {
            return 0; // valid
        }

        // Or, check if signer is authorized via a module
        for (uint i = 0; i < userOp.initCode.length; i++) {
            // Not gas efficient, normally you store array of modules
            address module = address(uint160(uint256(bytes32(userOp.initCode[i]))));
            if (modules[module]) {
                uint256 moduleValidation = IModule(module).validateUserOp(userOp, userOpHash);
                if (moduleValidation == 0) {
                    return 0; // valid via module
                }
            }
        }

        return 1; // invalid
    }

    function execute(address dest, uint256 value, bytes calldata func) external {
        require(msg.sender == entryPoint, "Only EntryPoint");
        (bool success, ) = dest.call{value: value}(func);
        require(success, "Execution failed");
    }

    function addModule(address module) external {
        require(msg.sender == owner, "Only owner");
        modules[module] = true;
    }

    function removeModule(address module) external {
        require(msg.sender == owner, "Only owner");
        modules[module] = false;
    }

    function recoverSigner(bytes32 hash, bytes memory signature) public pure returns (address) {
        return ECDSA.recover(hash, signature);
    }
}
