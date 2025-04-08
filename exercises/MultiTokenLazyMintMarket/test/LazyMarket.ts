import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "ethers";

describe("LazyMarket", function () {
  async function deployContractsFixture() {
    const [owner, seller, buyer] = await hre.ethers.getSigners();

    const Dummy1155 = await hre.ethers.getContractFactory("Dummy1155");
    const dummy1155 = await Dummy1155.connect(seller).deploy();

    const LazyMarket = await hre.ethers.getContractFactory("LazyMarket");
    const lazyMarket = await LazyMarket.deploy();

    return { owner, seller, buyer, dummy1155, lazyMarket };
  }

  async function createVoucher(
    domain: { name: string; version: string; chainId: number; verifyingContract: string },
    types: any,
    values: any,
    signer: any
  ) {
    const signature = await signer.signTypedData(domain, types, values);
    return signature;
  }

  it("should allow buyer to redeem a lazy minted voucher", async function () {
    const { seller, buyer, dummy1155, lazyMarket } = await loadFixture(deployContractsFixture);

    const chainId = (await hre.ethers.provider.getNetwork()).chainId;

    // Seller mints tokens
    await dummy1155.connect(seller).mint(seller.address, 1, 10, "0x");
    await dummy1155.connect(seller).setApprovalForAll(lazyMarket.target, true);

    const domain = {
      name: "Voucher Domain",
      version: "1",
      chainId,
      verifyingContract: lazyMarket.target,
    };

    const types = {
      BuyerVoucher: [
        { name: "tokenAddress", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "price", type: "uint256" },
        { name: "amount", type: "uint256" },
        { name: "uri", type: "string" },
        { name: "seller", type: "address" },
      ],
    };

    const voucherData = {
      tokenAddress: dummy1155.target,
      tokenId: 1,
      price: parseEther("0.01"),
      amount: 10,
      uri: "ipfs://example_uri",
      seller: seller.address,
    };

    const signature = await createVoucher(domain, types, voucherData, seller);

    const fullVoucher = {
      ...voucherData,
      signature,
    };

    const quantity = 2;
    const totalPrice = voucherData.price * BigInt(quantity);

    await expect(() =>
      lazyMarket.connect(buyer).buyLazyMint(fullVoucher, quantity, {
        value: totalPrice,
      })
    ).to.changeEtherBalances([buyer, seller], [-totalPrice, totalPrice]);

    const balance = await dummy1155.balanceOf(buyer.address, 1);
    expect(balance).to.equal(quantity);

    const redeemed = await lazyMarket.redeemed(signature);
    expect(redeemed).to.equal(quantity);
  });

  it("should fail with invalid signature", async function () {
    const { seller, buyer, dummy1155, lazyMarket } = await loadFixture(deployContractsFixture);

    const fakeVoucher = {
      tokenAddress: dummy1155.target,
      tokenId: 1,
      price: parseEther("0.01"),
      amount: 5,
      uri: "ipfs://fake",
      seller: seller.address,
      signature: "0xdeadbeef", // Invalid sig
    };
    await expect(
      lazyMarket.connect(buyer).buyLazyMint(fakeVoucher, 1, {
        value: fakeVoucher.price,
      })
    ).to.be.reverted;
  });

  it("should fail with incorrect ETH amount", async function () {
    const { seller, buyer, dummy1155, lazyMarket } = await loadFixture(deployContractsFixture);

    const chainId = (await hre.ethers.provider.getNetwork()).chainId;

    await dummy1155.connect(seller).mint(seller.address, 1, 5, "0x");
    await dummy1155.connect(seller).setApprovalForAll(lazyMarket.target, true);

    const domain = {
      name: "Voucher Domain",
      version: "1",
      chainId,
      verifyingContract: lazyMarket.target,
    };

    const types = {
      BuyerVoucher: [
        { name: "tokenAddress", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "price", type: "uint256" },
        { name: "amount", type: "uint256" },
        { name: "uri", type: "string" },
        { name: "seller", type: "address" },
      ],
    };

    const voucherData = {
      tokenAddress: dummy1155.target,
      tokenId: 1,
      price: parseEther("0.01"),
      amount: 5,
      uri: "ipfs://wrong",
      seller: seller.address,
    };

    const signature = await createVoucher(domain, types, voucherData, seller);

    const fullVoucher = {
      ...voucherData,
      signature,
    };

    await expect(
      lazyMarket.connect(buyer).buyLazyMint(fullVoucher, 2, {
        value: parseEther("0.01"), // should be 0.02
      })
    ).to.be.revertedWith("Incorrect ETH amount");
  });
});

