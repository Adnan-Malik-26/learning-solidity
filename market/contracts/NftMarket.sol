// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract GaneMarket is ERC721, ERC721URIStorage, Ownable, EIP712 {
    string private constant SIGNING_DOMAIN = "Voucher Domain";
    string private constant SIGNATURE_VERSION = "1";


    struct BuyerVoucher {
        uint256 tokenId;
        uint256 price;
        string uri;
        address seller;
        address buyer;
        bytes signature;
    }

    struct Listing {
        address seller;
        uint256 price;
    }

    mapping(uint256 => Listing) public listings;

    constructor() ERC721("GaneToken", "GTK") Ownable(msg.sender) EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {}

    
    function recover(BuyerVoucher calldata voucher) public view returns (address) {
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            keccak256("BuyerVoucher(uint256 tokenId,uint256 price,string uri,address seller,address buyer)"),
            voucher.tokenId,
            voucher.price,
            keccak256(bytes(voucher.uri)),
            voucher.seller,
            voucher.buyer
        )));

        return ECDSA.recover(digest, voucher.signature);
    }


    function buyLazyMintNFT(BuyerVoucher calldata voucher) external payable {
        address signer = recover(voucher);
        require(signer == voucher.seller, "Invalid seller signature");
        require(msg.value >= voucher.price, "Insufficient funds");

        if (_ownerOf(voucher.tokenId) == address(0)) {
            _safeMint(voucher.seller, voucher.tokenId);
            _setTokenURI(voucher.tokenId, voucher.uri);
        }

        _safeTransfer(voucher.seller, voucher.buyer, voucher.tokenId, "");

        (bool success, ) = payable(voucher.seller).call{value: msg.value}("");
        require(success, "ETH Transfer Failed.");
    }

    function listNFT(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not NFT owner");
        listings[tokenId] = Listing(msg.sender, price);
    }

    function buyListedNFT(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        require(msg.value >= listing.price, "Insufficient funds");
        require(listing.seller != address(0), "NFT not listed");

        _transfer(listing.seller, msg.sender, tokenId);
        delete listings[tokenId];

        (bool success, ) = payable(listing.seller).call{value: msg.value, gas: 30000}("");
        require(success, "ETH Transfer Failed.");
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
