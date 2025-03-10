// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract ERC721Mock is ERC721URIStorage {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://mock-uri-", tokenId)));
    }

    function setApprovalForAll(address operator, bool approved) public override(ERC721, IERC721) {
        super.setApprovalForAll(operator, approved);
    }
}

