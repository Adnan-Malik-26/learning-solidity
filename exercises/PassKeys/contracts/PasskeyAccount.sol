// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

contract PasskeyAccount is IAccount {
    using ECDSA for bytes32;

    address public ownerPublicKey;
    address public immutable entryPoint;

    constructor(address _ownerPublicKey, address _entryPoint) {
        ownerPublicKey = _ownerPublicKey;
        entryPoint = _entryPoint;
    }

    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 /* missingFunds */
    ) external view override returns (uint256 validationData) {
        // Manually apply Ethereum's signed message hash format
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash));

        // Recover the address from the signature
        address recovered = ECDSA.recover(ethSignedMessageHash, userOp.signature);
        
        // Ensure the signature matches the owner's public key
        require(recovered == ownerPublicKey, "Invalid Passkey Signature");
        return 0;
    }

    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external {
        require(msg.sender == entryPoint, "only EntryPoint can call execute");
        (bool success, ) = dest.call{value: value}(func);
        require(success, "Execution failed");
    }

    receive() external payable {}
}

