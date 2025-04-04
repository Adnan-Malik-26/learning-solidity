import { expect } from "chai";

async function deployFixture() {
    const [owner, seller, buyer] = await hre.ethers.getSigners();

    const GameToken = await hre.ethers.getContractFactory("MockERC1155");
    const gameToken = await GameToken.deploy(); // No need for .deployed()

    const Marketplace = await hre.ethers.getContractFactory("ERC1155Marketplace");
    const marketplace = await Marketplace.deploy(gameToken.target); // Use .target instead of .address

    return { marketplace, gameToken, owner, seller, buyer };
}

describe("ERC1155Marketplace", function () {
    it("should allow a seller to list an item", async function () {
        const { marketplace, gameToken, seller } = await deployFixture();
        const tokenId = 1;
        const amount = 10;
        const price = ethers.parseEther("1");

        await gameToken.connect(seller).mint(seller.address, tokenId, amount, "0x");
        await gameToken.connect(seller).setApprovalForAll(marketplace.target, true);
        await expect(marketplace.connect(seller).listItem(tokenId, amount, price))
            .to.emit(marketplace, "ItemListed")
            .withArgs(seller.address, tokenId, amount, price);
    });

    it("should allow a buyer to buy an item", async function () {
        const { marketplace, gameToken, seller, buyer } = await deployFixture();
        const tokenId = 1;
        const amount = 5;
        const price = ethers.parseEther("1");

        await gameToken.connect(seller).mint(seller.address, tokenId, amount * 2, "0x");
        await gameToken.connect(seller).setApprovalForAll(marketplace.target, true);
        await marketplace.connect(seller).listItem(tokenId, amount * 2, price);

        await expect(marketplace.connect(buyer).buyItem(tokenId, seller.address, amount, { value: price * BigInt(amount) }))
            .to.emit(marketplace, "ItemBought")
            .withArgs(buyer.address, seller.address, tokenId, amount, price);
    });

    it("should allow a seller to cancel their listing", async function () {
        const { marketplace, gameToken, seller } = await deployFixture();
        const tokenId = 1;
        const amount = 10;
        const price = ethers.parseEther("1");

        await gameToken.connect(seller).mint(seller.address, tokenId, amount, "0x");
        await gameToken.connect(seller).setApprovalForAll(marketplace.target, true);
        await marketplace.connect(seller).listItem(tokenId, amount, price);
        await expect(marketplace.connect(seller).cancelItem(tokenId))
            .to.emit(marketplace, "ItemCancelled")
            .withArgs(seller.address, tokenId);
    });

    it("should allow a seller to withdraw funds", async function () {
        const { marketplace, gameToken, seller, buyer } = await deployFixture();
        const tokenId = 1;
        const amount = 5;
        const price = ethers.parseEther("1");

        await gameToken.connect(seller).mint(seller.address, tokenId, amount * 2, "0x");
        await gameToken.connect(seller).setApprovalForAll(marketplace.target, true);
        await marketplace.connect(seller).listItem(tokenId, amount * 2, price);
        await marketplace.connect(buyer).buyItem(tokenId, seller.address, amount, { value: price * BigInt(amount) });

        await expect(marketplace.connect(seller).withdrawFunds())
            .to.emit(marketplace, "FundsWithdrawn")
            .withArgs(seller.address, price * BigInt(amount));
    });
});
