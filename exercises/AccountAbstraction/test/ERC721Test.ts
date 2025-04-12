import { expect } from "chai";
import { ethers as hreEthers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("MinimalAccount + ERC721 via UserOp", function () {
  async function deployFixture() {
    const [deployer, recipient, entryPointSigner] = await hreEthers.getSigners();

    // Deploy the MockNFT (from MockNFT.sol)
    const NFTFactory = await hreEthers.getContractFactory("MockNFT");
    const nft = await NFTFactory.deploy();
    await nft.waitForDeployment();

    // Deploy the MinimalAccount contract
    const MinimalFactory = await hreEthers.getContractFactory("MinimalAccount");
    const account = await MinimalFactory.deploy(await entryPointSigner.getAddress(), await deployer.getAddress());
    await account.waitForDeployment();

    // Fund the MinimalAccount
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

    // Mint an NFT to the MinimalAccount
    const tokenId = 0;
    await nft.connect(deployer).mint(accountAddress);
    expect(await nft.ownerOf(tokenId)).to.equal(accountAddress);

    // Encode transferFrom call
    const transferCalldata = nft.interface.encodeFunctionData("transferFrom", [
      accountAddress,
      await recipient.getAddress(),
      tokenId,
    ]);

    // Create user operation
    const userOp = {
      sender: accountAddress,
      to: nftAddress,
      value: 0,
      data: transferCalldata,
      signature: "0x",
    };

    // Encode and hash operation
    const encodedOp = hreEthers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256", "bytes"],
      [userOp.sender, userOp.to, userOp.value, userOp.data]
    );
    const userOpHash = hreEthers.keccak256(encodedOp);

    // Sign hash with account owner (deployer)
    const signature = await deployer.signMessage(hreEthers.getBytes(userOpHash));
    userOp.signature = signature;

    // Encode full userOp
    const userOpEncoded = hreEthers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(address sender, address to, uint256 value, bytes data, bytes signature)"],
      [userOp]
    );

    // Validate and execute
    await account.connect(entryPointSigner).validateUserOp(userOpEncoded, userOpHash, 0);
    await account.connect(deployer).execute(userOp.to, userOp.value, userOp.data);

    // Check that the NFT was transferred
    expect(await nft.ownerOf(tokenId)).to.equal(await recipient.getAddress());
  });

  it("should allow recipient to transfer approved NFT from MinimalAccount", async function () {
    const { deployer, recipient, nft, account } = await loadFixture(deployFixture);

    const accountAddress = await account.getAddress();
    const recipientAddress = await recipient.getAddress();

    const tokenId = 0;

    // Mint an NFT to the MinimalAccount
    await nft.connect(deployer).mint(accountAddress);
    expect(await nft.ownerOf(tokenId)).to.equal(accountAddress);

    // Approve recipient for the NFT
    const approveCalldata = nft.interface.encodeFunctionData("approve", [
      recipientAddress,
      tokenId,
    ]);

    // Owner (deployer) executes approval from MinimalAccount
    await account.connect(deployer).execute(await nft.getAddress(), 0, approveCalldata);

    // Check approval
    expect(await nft.getApproved(tokenId)).to.equal(recipientAddress);

    // Now recipient transfers the NFT to themself using transferFrom
    await nft.connect(recipient).transferFrom(accountAddress, recipientAddress, tokenId);

    // Check ownership
    expect(await nft.ownerOf(tokenId)).to.equal(recipientAddress);
  });
});

