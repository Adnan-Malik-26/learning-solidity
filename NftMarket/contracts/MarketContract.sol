// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract GaneMarket is Ownable, EIP712 {
    event NFTBought(address indexed buyer, address indexed seller, address indexed tokenAddress, uint256 tokenId, uint256 price);

    string private constant SIGNING_DOMAIN = "Voucher Domain";
    string private constant SIGNATURE_VERSION = "1";

    struct BuyerVoucher {
        address tokenAddress;
        uint256 tokenId;
        uint256 price;
        string uri;
        address seller;
        bytes signature;
    }

    constructor() Ownable(msg.sender) EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {}

    function recover(BuyerVoucher calldata voucher) public view returns (address) {
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            keccak256("BuyerVoucher(address tokenAddress,uint256 tokenId,uint256 price,string uri,address seller)"),
            voucher.tokenAddress,
            voucher.tokenId,
            voucher.price,
            keccak256(bytes(voucher.uri)),
            voucher.seller
        )));

        return ECDSA.recover(digest, voucher.signature);
    }

    function buyLazyMintNFT(BuyerVoucher calldata voucher, address buyer) external payable {
        address signer = recover(voucher);
        require(signer == voucher.seller, "Invalid seller signature");
        require(msg.value >= voucher.price, "Insufficient funds");

        if (IERC721(voucher.tokenAddress).ownerOf(voucher.tokenId) == voucher.seller) {
            IERC721(voucher.tokenAddress).safeTransferFrom(voucher.seller, buyer, voucher.tokenId);
        } else {
            revert("NFT not owned by seller");
        }

        (bool success, ) = payable(voucher.seller).call{value: msg.value}("");
        require(success, "ETH Transfer Failed.");

        emit NFTBought(buyer, voucher.seller, voucher.tokenAddress, voucher.tokenId, voucher.price);
    }
}
