import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { hre } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers.js";

describe("GaneToken", function () {
  async function deployFixture() {
    const [deployer, minter, buyer] = await hre.ethers.getSigners();
    const GaneTokenFactory = await hre.ethers.getContractFactory("GaneToken");
    const ganeToken = await GaneTokenFactory.deploy(minter.address);
    await ganeToken.waitForDeployment();

    return { deployer, minter, buyer, ganeToken };
  }

  it("Should deploy with correct minter address", async function () {
    const { ganeToken, minter } = await loadFixture(deployFixture);
    expect(await ganeToken.minter()).to.equal(minter.address);
  });

  it("Should correctly recover signer from a voucher", async function () {
    const { ganeToken, minter, buyer } = await loadFixture(deployFixture);

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

    // Verify that recover() returns the correct minter address
    expect(await ganeToken.recover(voucher)).to.equal(minter.address);
  });

  it("Should mint an NFT with a valid signature", async function () {
    const { ganeToken, minter, buyer } = await loadFixture(deployFixture);

    const voucher = {
      tokenId: 2,
      price: hre.ethers.parseEther("1"),
      uri: "https://example.com/token2.json",
      buyer: buyer.address,
    };

    // Minter signs the voucher
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

    // Buyer mints NFT
    await ganeToken.connect(buyer).safeMint(voucher, { value: voucher.price });

    // Check ownership
    expect(await ganeToken.ownerOf(voucher.tokenId)).to.equal(buyer.address);
  });

  it("Should fail minting with an invalid signature", async function () {
    const { ganeToken, buyer } = await loadFixture(deployFixture);

    const invalidVoucher = {
      tokenId: 3,
      price: hre.ethers.parseEther("1"),
      uri: "https://example.com/token3.json",
      buyer: buyer.address,
      signature: "0x1234", // Fake signature
    };

    await expect(
      ganeToken.connect(buyer).safeMint(invalidVoucher, { value: invalidVoucher.price })
    ).to.be.revertedWith("Wrong Signature.");
  });
});
