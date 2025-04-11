import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("MinimalAccount + ERC20", function () {
  async function deployFixture() {
    const [deployer, recipient] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("MyToken");
    const token = await TokenFactory.deploy(deployer.address);
    await token.waitForDeployment();

    const MinimalFactory = await ethers.getContractFactory("MinimalAccount");
    const entryPoint = deployer.address;
    const account = await MinimalFactory.deploy(entryPoint, deployer.address);
    await account.waitForDeployment();

    return { deployer, recipient, token, account };
  }

  it("should mint tokens to MinimalAccount and transfer them to recipient", async function () {
    const { deployer, recipient, token, account } = await loadFixture(deployFixture);

    const amount = ethers.parseEther("100");

    await token.connect(deployer).mint(account.target, amount);
    expect(await token.balanceOf(account.target)).to.equal(amount);

    const transferData = token.interface.encodeFunctionData("transfer", [
      recipient.address,
      amount,
    ]);

    await account.connect(deployer).execute(token.target, 0, transferData);

    expect(await token.balanceOf(account.target)).to.equal(0);
    expect(await token.balanceOf(recipient.address)).to.equal(amount);
  });
});

