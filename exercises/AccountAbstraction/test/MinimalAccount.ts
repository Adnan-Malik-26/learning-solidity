import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

describe("MinimalAccount", () => {
  async function deployFixture() {
    const [owner, otherAccount, entryPoint] = await hre.ethers.getSigners();

    const MinimalAccount = await hre.ethers.getContractFactory("MinimalAccount");
    const account = await MinimalAccount.deploy(entryPoint.address, owner.address);

    return { account, owner, otherAccount, entryPoint };
  }

  it("should deploy with correct owner and entry point", async () => {
    const { account, owner, entryPoint } = await loadFixture(deployFixture);
    expect(await account.owner()).to.equal(owner.address);
    expect(await account.entryPoint()).to.equal(entryPoint.address);
  });

  it("should receive ETH", async () => {
    const { account, otherAccount } = await loadFixture(deployFixture);

    const tx = await otherAccount.sendTransaction({
      to: account.address,
      value: hre.ethers.parseEther("1.0"),
    });
    await tx.wait();

    const balance = await hre.ethers.provider.getBalance(account.address);
    expect(balance).to.equal(hre.ethers.parseEther("1.0"));
  });


  it("should allow owner to execute a transaction", async () => {
    const { account, owner, otherAccount } = await loadFixture(deployFixture);

    await owner.sendTransaction({
      to: account.address,
      value: hre.ethers.parseEther("1"),
    });

    const recipient = await otherAccount.getAddress();

    const tx = await account.connect(owner).execute(
      recipient,
      hre.ethers.parseEther("0.5"),
      "0x"
    );
    await tx.wait();

    const balance = await hre.ethers.provider.getBalance(recipient);
    expect(balance).to.equal(hre.ethers.parseEther("0.5"));
  });

  it("should fail if non-owner tries to execute", async () => {
    const { account, otherAccount } = await loadFixture(deployFixture);

    await expect(
      account.connect(otherAccount).execute(
        otherAccount.address,
        hre.ethers.parseEther("0.1"),
        "0x"
      )
    ).to.be.revertedWithCustomError(account, "OwnableUnauthorizedAccount").withArgs(otherAccount.address);
  });

  it("should only allow EntryPoint to call validateUserOp", async () => {
    const { account, owner, otherAccount } = await loadFixture(deployFixture);

    const fakeHash = keccak256(toUtf8Bytes("test"));
    const userOp = hre.ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "bytes"],
      [owner.address, "0x"]
    );

    await expect(
      account.connect(otherAccount).validateUserOp(userOp, fakeHash, 0)
    ).to.be.revertedWith("Only EntryPoint");
  });

  it("should accept userOp from EntryPoint and return 0", async () => {
    const { account, owner, entryPoint } = await loadFixture(deployFixture);

    const fakeHash = keccak256(toUtf8Bytes("valid"));
    const userOp = hre.ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "bytes"],
      [owner.address, "0x"]
    );

    const tx = await account.connect(entryPoint).validateUserOp(userOp, fakeHash, 0);
    await tx.wait();
  });
});

