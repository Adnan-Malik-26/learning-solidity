// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract LazyMarket is Ownable, EIP712 {
    event NFTBought(
        address buyer,
        address seller,
        address tokenAddress,
        uint256 tokenId,
        uint256 price,
        uint256 amount
    );

    mapping(bytes => uint256) public redeemed;

    string private constant SIGNING_DOMAIN = "Voucher Domain";
    string private constant SIGNATURE_VERSION = "1";

    struct BuyerVoucher {
        address tokenAddress;
        uint256 tokenId;
        uint256 price;
        uint256 amount;
        string uri;
        address seller;
        bytes signature;
    }

    constructor() Ownable(msg.sender) EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {}

    function recover(BuyerVoucher calldata voucher) public view returns (address) {
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            keccak256("BuyerVoucher(address tokenAddress,uint256 tokenId,uint256 price,uint256 amount,string uri,address seller)"),
            voucher.tokenAddress,
            voucher.tokenId,
            voucher.price,
            voucher.amount,
            keccak256(bytes(voucher.uri)),
            voucher.seller
        )));

        return ECDSA.recover(digest, voucher.signature);
    }

    function buyLazyMint(BuyerVoucher calldata voucher) external payable {
        require(msg.value == voucher.price, "Incorrect ETH amount");
        require(recover(voucher) == voucher.seller, "Invalid signature");
        require(redeemed[voucher.signature] == 0, "Voucher already redeemed");

        IERC1155 token = IERC1155(voucher.tokenAddress);
        token.safeTransferFrom(voucher.seller, msg.sender, voucher.tokenId, voucher.amount, "");

        redeemed[voucher.signature] = 1;
        payable(voucher.seller).transfer(msg.value);

        emit NFTBought(msg.sender, voucher.seller, voucher.tokenAddress, voucher.tokenId, voucher.price, voucher.amount);
    }
}

