import { expect } from "chai";
import { ethers as hreEthers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("MinimalAccount + ERC721 via UserOp", function () {
  async function deployFixture() {
    const [deployer, recipient, entryPointSigner] = await hreEthers.getSigners();

    const NFTFactory = await hreEthers.getContractFactory("MockNFT");
    const nft = await NFTFactory.deploy();
    await nft.waitForDeployment();

    const MinimalFactory = await hreEthers.getContractFactory("MinimalAccount");
    const account = await MinimalFactory.deploy(await entryPointSigner.getAddress(), await deployer.getAddress());
    await account.waitForDeployment();

    await deployer.sendTransaction({
      to: await account.getAddress(),
      value: hreEthers.parseEther("1"),
    });

    return { deployer, recipient, entryPointSigner, nft, account };
  }

  it("should transfer an NFT using validateUserOp", async function () {
    const { deployer, recipient, entryPointSigner, nft, account } = await loadFixture(deployFixture);

    const accountAddress = await account.getAddress();
    const nftAddress = await nft.getAddress();

    const tokenId = 0;
    await nft.connect(deployer).mint(accountAddress);
    expect(await nft.ownerOf(tokenId)).to.equal(accountAddress);

    const transferCalldata = nft.interface.encodeFunctionData("transferFrom", [
      accountAddress,
      await recipient.getAddress(),
      tokenId,
    ]);

    const userOp = {
      sender: accountAddress,
      to: nftAddress,
      value: 0,
      data: transferCalldata,
      signature: "0x",
    };

    const encodedOp = hreEthers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256", "bytes"],
      [userOp.sender, userOp.to, userOp.value, userOp.data]
    );
    const userOpHash = hreEthers.keccak256(encodedOp);

    const signature = await deployer.signMessage(hreEthers.getBytes(userOpHash));
    userOp.signature = signature;

    const userOpEncoded = hreEthers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(address sender, address to, uint256 value, bytes data, bytes signature)"],
      [userOp]
    );

    await account.connect(entryPointSigner).validateUserOp(userOpEncoded, userOpHash, 0);
    await account.connect(deployer).execute(userOp.to, userOp.value, userOp.data);

    expect(await nft.ownerOf(tokenId)).to.equal(await recipient.getAddress());
  });

  it("should allow recipient to transfer approved NFT from MinimalAccount", async function () {
    const { deployer, recipient, nft, account } = await loadFixture(deployFixture);

    const accountAddress = await account.getAddress();
    const recipientAddress = await recipient.getAddress();

    const tokenId = 0;

    await nft.connect(deployer).mint(accountAddress);
    expect(await nft.ownerOf(tokenId)).to.equal(accountAddress);

    const approveCalldata = nft.interface.encodeFunctionData("approve", [
      recipientAddress,
      tokenId,
    ]);

    await account.connect(deployer).execute(await nft.getAddress(), 0, approveCalldata);

    expect(await nft.getApproved(tokenId)).to.equal(recipientAddress);

    await nft.connect(recipient).transferFrom(accountAddress, recipientAddress, tokenId);

    expect(await nft.ownerOf(tokenId)).to.equal(recipientAddress);
  });
});
