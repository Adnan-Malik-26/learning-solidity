// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract GaneToken is ERC721, ERC721URIStorage, Ownable, EIP712 {
    string private constant SIGNING_DOMAIN = "Voucher Domain";
    string private constant SIGNATURE_VERSION = "1";
    address public minter; 

    constructor(address _minter)
        ERC721("GaneToken", "GTK")
        Ownable(msg.sender)
        EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION)
    {
      minter = _minter;
    }
    
    struct LazyNFTVoucher {
      uint256 tokenId;
      uint256 price;
      string uri;
      address buyer;
      bytes signature;

    }

    function recover(LazyNFTVoucher calldata voucher) public view returns(address) {
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
          keccak256("LazyNFTVoucher(uint256 tokenId,uint256 price,string uri,address buyer)"),
          voucher.tokenId,
          voucher.price,
          keccak256(bytes(voucher.uri)),
          voucher.buyer
        )));

        address signer = ECDSA.recover(digest, voucher.signature);
        return signer;
    }


    function safeMint(LazyNFTVoucher calldata voucher)
        public
        payable
    {
        require(seller == recover(voucher),"Wrong Signature.");
        require(msg.value>=voucher.price, "Not Enough Ether Sent");
        _safeMint(voucher.buyer, voucher.tokenId);
        _setTokenURI(voucher.tokenId, voucher.uri);
    }


    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
