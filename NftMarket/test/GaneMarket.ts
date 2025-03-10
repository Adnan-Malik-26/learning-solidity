import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { Wallet } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";

describe("GaneMarket", function () {
  async function deployFixture() {
    const [deployer, seller, buyer] = await hre.ethers.getSigners();

    const ERC721Mock = await hre.ethers.getContractFactory("ERC721Mock");
    const nft = await ERC721Mock.deploy("TestNFT", "TNFT");
    await nft.waitForDeployment(); 

    const GaneMarket = await hre.ethers.getContractFactory("GaneMarket");
    const market = await GaneMarket.deploy();
    await market.waitForDeployment(); 

    return { market, nft, deployer, seller, buyer };
  }
// pehle deploy
  // mint to first user 
  // voucher to first user with approval to marketplace
  // second user voucher bhejega woh function hit hoga aur woh trade ho jana chahiye
});
