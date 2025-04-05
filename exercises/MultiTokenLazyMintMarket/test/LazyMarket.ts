import { expect } from "chai";
import { ethers as hreEthers } from "hardhat";
import { Signer, Contract, BytesLike } from "ethers";

describe("GaneMarket", function () {
  async function deployFixture() {
    const [owner, seller, buyer] = await hreEthers.getSigners();

    const ERC1155Mock = await hreEthers.getContractFactory("ERC1155Mock");
    const token = await ERC1155Mock.connect(seller).deploy("https://api.example.com/metadata/");
    await token.waitForDeployment();

    // Mint some tokens to the seller
    await token.connect(seller).mint(seller.address, 1, 10, "0x");

    const GaneMarket = await hreEthers.getContractFactory("GaneMarket");
    const market = await GaneMarket.connect(owner).deploy();
    await market.waitForDeployment();

    return { market, token, owner, seller, buyer };
  }

  function getVoucherSignature(
    domain: any,
    types: any,
    values: any,
    signer: Signer
  ): Promise<BytesLike> {
    return (signer as any)._signTypedData(domain, types, values);
  }

  it("should allow a buyer to buy via lazy minting", async () => {
    const { market, token, seller, buyer } = await deployFixture();

    const tokenId = 1;
    const price = hreEthers.parseEther("1");
    const amount = 2;
    const uri = "https://api.example.com/metadata/1";

    const domain = {
      name: "Voucher Domain",
      version: "1",
      chainId: await buyer.provider!.getNetwork().then((n) => n.chainId),
      verifyingContract: await market.getAddress(),
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

    const values = {
      tokenAddress: await token.getAddress(),
      tokenId,
      price,
      amount,
      uri,
      seller: seller.address,
    };

    const signature = await getVoucherSignature(domain, types, values, seller);

    const voucher = {
      ...values,
      signature,
    };

    await token.connect(seller).setApprovalForAll(await market.getAddress(), true);

    const buyerBalanceBefore = await hreEthers.provider.getBalance(buyer.address);
    const sellerBalanceBefore = await hreEthers.provider.getBalance(seller.address);

    const tx = await market.connect(buyer).buyLazyMint(voucher, { value: price });
    await tx.wait();

    const buyerBalance = await token.balanceOf(buyer.address, tokenId);
    const sellerBalance = await token.balanceOf(seller.address, tokenId);

    expect(buyerBalance).to.equal(amount);
    expect(sellerBalance).to.equal(10 - amount);
  });

  it("should revert if voucher is reused", async () => {
    const { market, token, seller, buyer } = await deployFixture();

    const tokenId = 1;
    const price = hreEthers.parseEther("1");
    const amount = 1;
    const uri = "https://api.example.com/metadata/1";

    const domain = {
      name: "Voucher Domain",
      version: "1",
      chainId: await buyer.provider!.getNetwork().then((n) => n.chainId),
      verifyingContract: await market.getAddress(),
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

    const values = {
      tokenAddress: await token.getAddress(),
      tokenId,
      price,
      amount,
      uri,
      seller: seller.address,
    };

    const signature = await getVoucherSignature(domain, types, values, seller);

    const voucher = {
      ...values,
      signature,
    };

    await token.connect(seller).setApprovalForAll(await market.getAddress(), true);

    await market.connect(buyer).buyLazyMint(voucher, { value: price });

    await expect(
      market.connect(buyer).buyLazyMint(voucher, { value: price })
    ).to.be.revertedWith("Voucher already redeemed");
  });
});
