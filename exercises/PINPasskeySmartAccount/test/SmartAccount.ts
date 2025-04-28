import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, hre } from "hardhat"; 
import { keccak256, AbiCoder, Contract, Signer } from "ethers";

const abiCoder = new AbiCoder();

async function deploySmartAccountFixture() {
  const [deployer, otherAccount] = await ethers.getSigners();
  
  const pin = 1234;
  const pinHash = keccak256(abiCoder.encode(["uint256"], [pin]));

  const SmartAccount = await ethers.getContractFactory("SmartAccount");
  const smartAccountInstance = await SmartAccount.deploy(pinHash);
  await smartAccountInstance.waitForDeployment();

  return { smartAccountInstance, deployer, otherAccount };
}

describe("SmartAccount", function () {
  it("Should execute transaction with correct PIN", async function () {
    const { smartAccountInstance, deployer, otherAccount } = await loadFixture(deploySmartAccountFixture);

    const tx = await smartAccountInstance.connect(deployer).executeTransaction(
      await deployer.getAddress(),
      0,
      "0x",
      1234
    );
    await tx.wait();
  });

  it("Should fail transaction with wrong PIN", async function () {
    const { smartAccountInstance, deployer } = await loadFixture(deploySmartAccountFixture);

    await expect(
      smartAccountInstance.connect(deployer).executeTransaction(
        await deployer.getAddress(),
        0,
        "0x",
        1111
      )
    ).to.be.revertedWith("Invalid PIN");
  });

});

