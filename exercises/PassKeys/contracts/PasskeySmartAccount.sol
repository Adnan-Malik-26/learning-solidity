// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PasskeySmartAccount {
    address public owner;

    event Executed(address target, uint256 value, bytes data);
    event OwnerChanged(address oldOwner, address newOwner);

    constructor(address _owner) {
        require(_owner != address(0), "Owner cannot be zero address");
        owner = _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function execute(address target, uint256 value, bytes calldata data) external onlyOwner {
        (bool success, ) = target.call{value: value}(data);
        require(success, "Transaction failed");
        emit Executed(target, value, data);
    }

    function changeOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    receive() external payable {}
}

