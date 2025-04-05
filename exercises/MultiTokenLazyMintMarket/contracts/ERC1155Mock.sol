// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ERC1155Mock is ERC1155, Ownable {
    constructor(string memory uri) ERC1155(uri) Ownable(msg.sender) {}

    function mint(address to, uint256 id, uint256 amount, bytes memory data) external onlyOwner {
        _mint(to, id, amount, data);
    }
}

