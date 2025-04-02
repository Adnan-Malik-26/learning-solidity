// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
/* FUNCTIONS:
  X listItem
  - buyItem
  - cancelItem
  - withdrawFunds

  */
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC1155Marketplace is Ownable {
    struct Listing {
        address seller;
        uint256 price;
        uint256 amount;
    }

    IERC1155 public immutable gameToken;

    mapping(uint256 => mapping(address => Listing)) public listings;

    event ItemListed(address indexed seller, uint256 indexed tokenId, uint256 amount, uint256 price);

    constructor(address _gameToken) Ownable(msg.sender) {
        gameToken = IERC1155(_gameToken);
    }

    // List an ERC-1155 token for sale
    function listItem(uint256 tokenId, uint256 amount, uint256 price) external {
        require(amount > 0, "Amount must be greater than zero");
        require(price > 0, "Price must be greater than zero");

        require(gameToken.balanceOf(msg.sender, tokenId) >= amount, "Not enough tokens owned");
        require(gameToken.isApprovedForAll(msg.sender, address(this)), "Marketplace not approved");

        listings[tokenId][msg.sender] = Listing(msg.sender, price, amount);

        emit ItemListed(msg.sender, tokenId, amount, price);
    }
}
