// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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
    mapping(address => uint256) public balances;

    event ItemListed(address indexed seller, uint256 indexed tokenId, uint256 amount, uint256 price);
    event ItemBought(address indexed buyer, address indexed seller, uint256 indexed tokenId, uint256 amount, uint256 price);
    event ItemCancelled(address indexed seller, uint256 indexed tokenId);
    event FundsWithdrawn(address indexed seller, uint256 amount);

    constructor(address _gameToken) Ownable(msg.sender) {
        gameToken = IERC1155(_gameToken);
    }

    function listItem(uint256 tokenId, uint256 amount, uint256 price) external {
        require(amount > 0, "Amount must be greater than zero");
        require(price > 0, "Price must be greater than zero");
        require(gameToken.balanceOf(msg.sender, tokenId) >= amount, "Not enough tokens owned");
        require(gameToken.isApprovedForAll(msg.sender, address(this)), "Marketplace not approved");

        listings[tokenId][msg.sender] = Listing(msg.sender, price, amount);

        emit ItemListed(msg.sender, tokenId, amount, price);
    }

    function buyItem(uint256 tokenId, address seller, uint256 amount) external payable {
        Listing storage listing = listings[tokenId][seller];
        require(listing.amount >= amount, "Not enough items listed");
        require(msg.value == listing.price * amount, "Incorrect price");

        listing.amount -= amount;
        balances[seller] += msg.value;
        gameToken.safeTransferFrom(seller, msg.sender, tokenId, amount, "");

        emit ItemBought(msg.sender, seller, tokenId, amount, listing.price);
    }

    function cancelItem(uint256 tokenId) external {
        Listing storage listing = listings[tokenId][msg.sender];
        require(listing.amount > 0, "No listing found");

        delete listings[tokenId][msg.sender];

        emit ItemCancelled(msg.sender, tokenId);
    }

    function withdrawFunds() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No funds to withdraw");

        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit FundsWithdrawn(msg.sender, amount);
    }
}
