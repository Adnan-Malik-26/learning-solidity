import { expect } from "chai";
import { ethers } from "hardhat";
import { LazyMarket, ERC1155Mock } from "../typechain-types";

describe("LazyMarket", function () {
  async function deployFixture() {
    const [owner, seller, buyer] = await ethers.getSigners();

    const ERC1155Mock = await ethers.getContractFactory("ERC1155Mock");
    const token = await ERC1155Mock.connect(seller).deploy("https://api.example.com/metadata/");
    await token.waitForDeployment();

    await token.connect(seller).mint(seller.address, 1, 10, "0x");

    const LazyMarket = await ethers.getContractFactory("LazyMarket");
    const market = await LazyMarket.connect(owner).deploy();
    await market.waitForDeployment();

    return { market, token, owner, seller, buyer };
  }

  async function signVoucher(voucher: any, seller: any, verifyingContract: string) {
    const domain = {
      name: "Voucher Domain",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract,
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

    return await seller.signTypedData(domain, types, voucher);
  }

  it("should buy NFT via lazy mint", async () => {
    const { market, token, seller, buyer } = await deployFixture();

    const tokenId = 1;
    const price = ethers.parseEther("1");
    const amount = 2;
    const uri = "https://api.example.com/metadata/1";

    const voucher = {
      tokenAddress: await token.getAddress(),
      tokenId,
      price,
      amount,
      uri,
      seller: seller.address,
    };

    const signature = await signVoucher(voucher, seller, await market.getAddress());

    const fullVoucher = {
      ...voucher,
      signature,
    };

    await token.connect(seller).setApprovalForAll(await market.getAddress(), true);

    await expect(() =>
      market.connect(buyer).buyLazyMint(fullVoucher, { value: price })
    ).to.changeEtherBalances([buyer, seller], [price * -1n, price]);

    expect(await token.balanceOf(buyer.address, tokenId)).to.equal(amount);
    expect(await token.balanceOf(seller.address, tokenId)).to.equal(10 - amount);
  });

  it("should revert if incorrect ETH amount is sent", async () => {
    const { market, token, seller, buyer } = await deployFixture();

    const tokenId = 1;
    const price = ethers.parseEther("1");
    const incorrectPrice = ethers.parseEther("0.5");
    const amount = 1;
    const uri = "https://api.example.com/metadata/1";

    const voucher = {
      tokenAddress: await token.getAddress(),
      tokenId,
      price,
      amount,
      uri,
      seller: seller.address,
    };

    const signature = await signVoucher(voucher, seller, await market.getAddress());
    const fullVoucher = { ...voucher, signature };

    await token.connect(seller).setApprovalForAll(await market.getAddress(), true);

    await expect(
      market.connect(buyer).buyLazyMint(fullVoucher, { value: incorrectPrice })
    ).to.be.revertedWith("Incorrect ETH amount");
  });

  it("should revert if voucher is reused", async () => {
    const { market, token, seller, buyer } = await deployFixture();

    const tokenId = 1;
    const price = ethers.parseEther("1");
    const amount = 1;
    const uri = "https://api.example.com/metadata/1";

    const voucher = {
      tokenAddress: await token.getAddress(),
      tokenId,
      price,
      amount,
      uri,
      seller: seller.address,
    };

    const signature = await signVoucher(voucher, seller, await market.getAddress());
    const fullVoucher = { ...voucher, signature };

    await token.connect(seller).setApprovalForAll(await market.getAddress(), true);

    // First purchase
    await market.connect(buyer).buyLazyMint(fullVoucher, { value: price });

    // Second attempt with the same voucher should fail
    await expect(
      market.connect(buyer).buyLazyMint(fullVoucher, { value: price })
    ).to.be.revertedWith("Voucher already redeemed");
  });
});
