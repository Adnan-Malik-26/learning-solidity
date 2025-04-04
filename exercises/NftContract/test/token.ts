import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers.js";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";

describe("GaneToken", function () {
  async function deployToken() {
    const [deployer, minter, buyer] = await hre.ethers.getSigners();
    const GaneTokenFactory = await hre.ethers.getContractFactory("GaneToken");
    const ganeToken = await GaneTokenFactory.deploy(minter.address);
    await ganeToken.waitForDeployment();

    return { deployer, minter, buyer, ganeToken };
  }

  it("Should Deploy with Correct Minter Address", async function () {
    const { ganeToken, minter } = await loadFixture(deployToken);
    expect(await ganeToken.minter()).to.equal(minter.address);
  });

  it("Should correctly recover signer from a voucher", async function () {
    const { ganeToken, minter, buyer } = await loadFixture(deployToken);
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    const contractAddress = await ganeToken.getAddress();

    const voucher = {
      tokenId: 1,
      price: hre.ethers.parseEther("1"),
      uri: "https://example.com/token.json",
      buyer: buyer.address,
    };

    voucher["signature"] = await minter.signTypedData(
      {
        name: "Voucher Domain",
        version: "1",
        chainId: (await hre.ethers.provider.getNetwork()).chainId,
        verifyingContract: await ganeToken.getAddress(),
      },
      { LazyNFTVoucher: [
        { name: "tokenId", type: "uint256" },
        { name: "price", type: "uint256" },
        { name: "uri", type: "string" },
        { name: "buyer", type: "address" },
      ] },
      voucher
    );
    const recoveredAddress = await ganeToken.recover(voucher);
    expect(recoveredAddress).to.equal(minter.address);
  });

  it("Should mint nft with correct signature ", async function(){
    const { ganeToken, minter, buyer } = await loadFixture(deployToken);
   
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    const contractAddress = await ganeToken.getAddress();

    const voucher = {
      tokenId: 1,
      price: hre.ethers.parseEther("1"),
      uri: "https://example.com/token.json",
      buyer: buyer.address,
    };

    voucher["signature"] = await minter.signTypedData(
      {
        name: "Voucher Domain",
        version: "1",
        chainId: (await hre.ethers.provider.getNetwork()).chainId,
        verifyingContract: await ganeToken.getAddress(),
      },
      { LazyNFTVoucher: [
        { name: "tokenId", type: "uint256" },
        { name: "price", type: "uint256" },
        { name: "uri", type: "string" },
        { name: "buyer", type: "address" },
      ] },
      voucher
    );
    expect(await ganeToken.recover(voucher)).to.equal(minter.address);
  });

  it("Should extract correct signer from the voucher", async function(){
    const { ganeToken, minter, buyer } = await loadFixture(deployToken);

    // Create a voucher
    const voucher = {
      tokenId: 1,
      price: hre.ethers.parseEther("1"),
      uri: "https://example.com/token.json",
      buyer: buyer.address,
    };

    // Sign the voucher
    voucher["signature"] = await minter.signTypedData(
      {
        name: "Voucher Domain",
        version: "1",
        chainId: (await hre.ethers.provider.getNetwork()).chainId,
        verifyingContract: await ganeToken.getAddress(),
      },
      { LazyNFTVoucher: [
        { name: "tokenId", type: "uint256" },
        { name: "price", type: "uint256" },
        { name: "uri", type: "string" },
        { name: "buyer", type: "address" },
      ] },
      voucher
    );

    expect(await ganeToken.recover(voucher)).to.equal(minter.address);
  });
});
