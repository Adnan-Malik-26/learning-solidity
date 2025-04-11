// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IEntryPoint {
    function validateUserOp(
        bytes calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256);
}

contract MinimalAccount is Ownable {
    using ECDSA for bytes32;

    IEntryPoint public entryPoint;

    constructor(address _entryPoint, address initialOwner) Ownable(initialOwner) {
        entryPoint = IEntryPoint(_entryPoint);
    }

    receive() external payable {}

    function validateUserOp(
        bytes calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256) {
        require(msg.sender == address(entryPoint), "Only EntryPoint");

        (address recovered,) = abi.decode(userOp, (address, bytes));
        require(recovered == owner(), "Invalid signature");

        if (missingAccountFunds > 0) {
            payable(msg.sender).transfer(missingAccountFunds);
        }

        return 0;
    }

    function execute(address to, uint256 value, bytes calldata data) external onlyOwner {
        (bool success, ) = to.call{value: value}(data);
        require(success, "Call failed");
    }
}

