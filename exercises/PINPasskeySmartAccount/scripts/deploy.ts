import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  const pin = 1234;
  const pinHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["uint256"], [pin]));

  const SmartAccount = await hre.ethers.getContractFactory("SmartAccount");
  const smartAccount = await SmartAccount.deploy(pinHash);

  await smartAccount.deployed();

  console.log(`SmartAccount deployed to: ${smartAccount.address}`);
}
