// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

interface IEntryPoint {
    function validateUserOp(
        bytes calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256);
}

contract MinimalAccount is Ownable {
    IEntryPoint public entryPoint;

    constructor(address _entryPoint, address initialOwner) Ownable(initialOwner) {
        entryPoint = IEntryPoint(_entryPoint);
    }

    receive() external payable {}

    struct UserOperation {
        address sender;
        address to;
        uint256 value;
        bytes data;
        bytes signature;
    }

    function validateUserOp(
        bytes calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256) {
        require(msg.sender == address(entryPoint), "Only EntryPoint");

        // Decode the user operation
        UserOperation memory op = abi.decode(userOp, (UserOperation));

        // Create the Ethereum signed message hash
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);

        // Recover signer from the signature
        address recovered = ECDSA.recover(ethSignedHash, op.signature);
        require(recovered == owner(), "Invalid signature");

        // Fund EntryPoint if needed
        if (missingAccountFunds > 0) {
            (bool sent, ) = msg.sender.call{value: missingAccountFunds}("");
            require(sent, "Funding EntryPoint failed");
        }

        return 0;
    }

    function execute(address to, uint256 value, bytes calldata data) external onlyOwner {
        (bool success, ) = to.call{value: value}(data);
        require(success, "Call failed");
    }
}

