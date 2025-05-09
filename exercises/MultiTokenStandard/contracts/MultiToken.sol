// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GaneToken is ERC1155, Ownable{
  uint256 public constant GOLD = 0;
  uint256 public constant SILVER = 1;
  uint256 public constant THORS_HAMMER = 2;
  uint256 public constant SWORD = 3;
  uint256 public constant SHIELD = 4;
  

  constructor () ERC1155("https://game.example/api/item/{id}.json") Ownable(msg.sender){
    _mint(msg.sender, GOLD, 10**18, "");    
    _mint(msg.sender, SILVER, 10**27, "");    
    _mint(msg.sender, THORS_HAMMER, 1, "");    
    _mint(msg.sender, SWORD, 10**9, "");    
    _mint(msg.sender, SHIELD, 10**9, "");    
  }

  function mint(address to, uint256 id, uint256 amount) public onlyOwner{
    _mint(to ,id ,amount, "");
  }
}
