import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("GaneMarket", function () {
  async function deployContracts() {
    const [owner, seller, buyer] = await hre.ethers.getSigners();

    // Deploy mock ERC1155 contract
    const ERC1155Mock = await hre.ethers.getContractFactory("ERC1155Mock");
    const erc1155 = await ERC1155Mock.deploy();
    await erc1155.waitForDeployment();

    // Mint an NFT to the seller
    const tokenId = 1;
    const amount = 1;
    await erc1155.mint(seller.address, tokenId, amount, "0x");

    // Deploy GaneMarket contract
    const GaneMarket = await hre.ethers.getContractFactory("GaneMarket");
    const market = await GaneMarket.deploy();
    await market.waitForDeployment();

    return { owner, seller, buyer, erc1155, market, tokenId, amount };
  }

  it("Should deploy correctly and set the owner", async function () {
    const { market, owner } = await loadFixture(deployContracts); // Fix function name
    expect(await market.owner()).to.equal(owner.address);
  });

  it("Should recover the signer from a voucher", async function () {
    const { market, seller } = await loadFixture(deployContracts); // Fix function name

    const voucher = {
      tokenAddress: seller.address,
      tokenId: 1,
      price: hre.ethers.parseEther("1"),
      amount: 2,
      redeemed: 0,
      uri: "ipfs://example",
      seller: seller.address,
    };

    const domain = {
      name: "Voucher Domain",
      version: "1",
      chainId: (await hre.ethers.provider.getNetwork()).chainId,
      verifyingContract: await market.getAddress(), // Fix: use getAddress()
    };

    const types = {
      BuyerVoucher: [
        { name: "tokenAddress", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "price", type: "uint256" },
        { name: "amount", type: "uint256" },
        { name: "redeemed", type: "uint256" },
        { name: "uri", type: "string" },
        { name: "seller", type: "address" },
      ],
    };

    const signature = await seller.signTypedData(domain, types, voucher);
    const recoveredAddress = await market.recover({ ...voucher, signature });

    expect(recoveredAddress).to.equal(seller.address);
  });

  it("Should allow a buyer to purchase a lazy-minted NFT", async function () {
    const { seller, buyer, erc1155, market, tokenId, amount } = await loadFixture(deployContracts); // Fix function name

    const price = hre.ethers.parseEther("1");
    const uri = "https://example.com/token.json";

    // Seller must approve the market contract to transfer NFTs
    await erc1155.connect(seller).setApprovalForAll(await market.getAddress(), true);

    // Create voucher
    const voucher = {
      tokenAddress: await erc1155.getAddress(),
      tokenId,
      price,
      amount,
      redeemed: 0,
      uri,
      seller: seller.address,
    };

    // Seller signs the voucher
    const domain = {
      name: "Voucher Domain",
      version: "1",
      chainId: (await hre.ethers.provider.getNetwork()).chainId,
      verifyingContract: await market.getAddress(), // Fix: use getAddress()
    };

    const types = {
      BuyerVoucher: [
        { name: "tokenAddress", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "price", type: "uint256" },
        { name: "amount", type: "uint256" },
        { name: "redeemed", type: "uint256" },
        { name: "uri", type: "string" },
        { name: "seller", type: "address" },
      ],
    };

    const signature = await seller.signTypedData(domain, types, voucher);
    voucher.signature = signature;

    // Buyer buys NFT
    await expect(
      market.connect(buyer).buyLazyMint(voucher, { value: price })
    ).to.emit(market, "NFTBought").withArgs(
      buyer.address,
      seller.address,
      await erc1155.getAddress(),
      tokenId,
      price,
      amount
    );

    // Check ownership transfer
    expect(await erc1155.balanceOf(buyer.address, tokenId)).to.equal(amount);
  });
});

