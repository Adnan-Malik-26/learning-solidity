// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

contract SocialRecoveryModule {
    address[] public guardians;

    constructor(address[] memory _guardians) {
        guardians = _guardians;
    }

    function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash) external view returns (uint256 validationData) {
        address signer = recoverSigner(userOpHash, userOp.signature);
        for (uint i = 0; i < guardians.length; i++) {
            if (signer == guardians[i]) {
                return 0; // guardian approved
            }
        }
        return 1; // invalid
    }

    function recoverSigner(bytes32 hash, bytes memory signature) public pure returns (address) {
        return ECDSA.recover(hash, signature);
    }
}

