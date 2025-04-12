import { expect } from "chai";
import { ethers as hreEthers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("MinimalAccount + ERC20 via UserOp", function () {
  async function deployFixture() {
    const [deployer, recipient, entryPointSigner] = await hreEthers.getSigners();

    const TokenFactory = await hreEthers.getContractFactory("MyToken");
    const token = await TokenFactory.deploy(deployer.address);
    await token.waitForDeployment();

    const MinimalFactory = await hreEthers.getContractFactory("MinimalAccount");
    const account = await MinimalFactory.deploy(entryPointSigner.address, deployer.address);
    await account.waitForDeployment();

    await deployer.sendTransaction({
      to: await account.getAddress(),
      value: hreEthers.parseEther("1"),
    });

    return { deployer, recipient, entryPointSigner, token, account };
  }

  it("should transfer tokens using validateUserOp", async function () {
    const { deployer, recipient, entryPointSigner, token, account } =
      await loadFixture(deployFixture);

    const amount = hreEthers.parseEther("100");

    const accountAddress = await account.getAddress();
    const tokenAddress = await token.getAddress();

    await token.connect(deployer).mint(accountAddress, amount);
    expect(await token.balanceOf(accountAddress)).to.equal(amount);

    const transferCalldata = token.interface.encodeFunctionData("transfer", [
      recipient.address,
      amount,
    ]);

    const userOp = {
      sender: accountAddress,
      to: tokenAddress,
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
      [
        "tuple(address sender, address to, uint256 value, bytes data, bytes signature)",
      ],
      [userOp]
    );

    await account
      .connect(entryPointSigner)
      .validateUserOp(userOpEncoded, userOpHash, 0);

    await account.connect(deployer).execute(userOp.to, userOp.value, userOp.data);

    expect(await token.balanceOf(accountAddress)).to.equal(0);
    expect(await token.balanceOf(recipient.address)).to.equal(amount);
  });
});

