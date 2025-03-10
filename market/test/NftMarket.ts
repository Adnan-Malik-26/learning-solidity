import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("NFTMarketplace", function () {
    async function deployFixture() {
        const [owner, seller, buyer, other] = await hre.ethers.getSigners();

        const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
        const marketplace = await NFTMarketplace.deploy();
        await marketplace.waitForDeployment();

        return { marketplace, owner, seller, buyer, other };
    }

    async function createVoucher(
        marketplace: any,
        seller: SignerWithAddress,
        tokenId: number,
        price: string,
        uri: string,
        buyer: string
    ) {
        const domain = {
            name: "Voucher Domain",
            version: "1",
            chainId: (await hre.ethers.provider.getNetwork()).chainId,
            verifyingContract: await marketplace.getAddress(),
        };

        const types = {
            BuyerVoucher: [
                { name: "tokenId", type: "uint256" },
                { name: "price", type: "uint256" },
                { name: "uri", type: "string" },
                { name: "seller", type: "address" },
                { name: "buyer", type: "address" },
            ],
        };

        const voucher = {
            tokenId,
            price: hre.ethers.parseEther(price),
            uri,
            seller: await seller.getAddress(),
            buyer,
        };

        const signature = await seller.signTypedData(domain, types, voucher);
        return { ...voucher, signature };
    }

    it("Should allow lazy minting and transfer", async function () {
        const { marketplace, seller, buyer } = await loadFixture(deployFixture);
        const tokenId = 1;
        const price = "1.0";
        const uri = "ipfs://example";

        const voucher = await createVoucher(marketplace, seller, tokenId, price, uri, await buyer.getAddress());

        await expect(
            marketplace.connect(buyer).buyLazyMintNFT(voucher, { value: hre.ethers.parseEther(price) })
        ).to.changeEtherBalances([seller, buyer], [hre.ethers.parseEther(price), hre.ethers.parseEther(`-${price}`)]);

        expect(await marketplace.ownerOf(tokenId)).to.equal(await buyer.getAddress());
    });

    it("Should revert if buyer sends insufficient funds", async function () {
        const { marketplace, seller, buyer } = await loadFixture(deployFixture);
        const tokenId = 2;
        const price = "1.0";
        const uri = "ipfs://example";

        const voucher = await createVoucher(marketplace, seller, tokenId, price, uri, await buyer.getAddress());

        await expect(
            marketplace.connect(buyer).buyLazyMintNFT(voucher, { value: hre.ethers.parseEther("0.5") })
        ).to.be.revertedWith("Insufficient funds");
    });

    it("Should allow listing and buying an existing NFT", async function () {
        const { marketplace, seller, buyer } = await loadFixture(deployFixture);
        const tokenId = 3;
        const price = "2.0";

        await marketplace.connect(seller).listNFT(tokenId, hre.ethers.parseEther(price));

        await expect(
            marketplace.connect(buyer).buyListedNFT(tokenId, { value: hre.ethers.parseEther(price) })
        ).to.changeEtherBalances([seller, buyer], [hre.ethers.parseEther(price), hre.ethers.parseEther(`-${price}`)]);

        expect(await marketplace.ownerOf(tokenId)).to.equal(await buyer.getAddress());
    });

    it("Should revert buying listed NFT if price is not met", async function () {
        const { marketplace, seller, buyer } = await loadFixture(deployFixture);
        const tokenId = 4;
        const price = "2.0";

        await marketplace.connect(seller).listNFT(tokenId, hre.ethers.parseEther(price));

        await expect(
            marketplace.connect(buyer).buyListedNFT(tokenId, { value: hre.ethers.parseEther("1.0") })
        ).to.be.revertedWith("Insufficient funds");
    });

    it("Should revert if invalid signature is used in lazy minting", async function () {
        const { marketplace, seller, buyer, other } = await loadFixture(deployFixture);
        const tokenId = 5;
        const price = "1.5";
        const uri = "ipfs://example";

        const voucher = await createVoucher(marketplace, seller, tokenId, price, uri, await buyer.getAddress());

        voucher.signature = await other.signTypedData(
            {
                name: "Voucher Domain",
                version: "1",
                chainId: (await hre.ethers.provider.getNetwork()).chainId,
                verifyingContract: await marketplace.getAddress(),
            },
            {
                BuyerVoucher: [
                    { name: "tokenId", type: "uint256" },
                    { name: "price", type: "uint256" },
                    { name: "uri", type: "string" },
                    { name: "seller", type: "address" },
                    { name: "buyer", type: "address" },
                ],
            },
            {
                tokenId,
                price: hre.ethers.parseEther(price),
                uri,
                seller: await seller.getAddress(),
                buyer: await buyer.getAddress(),
            }
        );

        await expect(
            marketplace.connect(buyer).buyLazyMintNFT(voucher, { value: hre.ethers.parseEther(price) })
        ).to.be.revertedWith("Invalid seller signature");
    });
});
