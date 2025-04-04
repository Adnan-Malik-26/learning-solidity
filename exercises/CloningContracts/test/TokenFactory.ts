import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { GaneToken, TokenFactory } from "../typechain-types";

describe("TokenFactory", function () {
  async function deployContractsFixture() {
    const [owner, addr1] = await hre.ethers.getSigners();
    const GaneToken = await ethers.getContractFactory("GaneToken");
    const ganeTokenImplementation = await GaneToken.deploy();
    await ganeTokenImplementation.waitForDeployment();

    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    const tokenFactory = await TokenFactory.deploy(
      await ganeTokenImplementation.getAddress()
    );
    await tokenFactory.waitForDeployment();

    return { ganeTokenImplementation, tokenFactory, owner, addr1 };
  }

  it("Should deploy a new token clone and initialize correctly", async function () {
    const { tokenFactory, owner } = await loadFixture(deployContractsFixture);
    const cloneAddress = 
    const tx = await tokenFactory.createToken("GaneToken", "GTN");
    const receipt = await tx.wait();

    expect(cloneAddress).to.not.be.undefined;
    expect(cloneAddress).to.not.equal(ethers.ZeroAddress);

    const ClonedToken = await ethers.getContractAt("GaneToken", cloneAddress);

    expect(await ClonedToken.name()).to.equal("GaneToken");
    expect(await ClonedToken.symbol()).to.equal("GTN");
    expect(await ClonedToken.balanceOf(owner.address)).to.equal(
      ethers.parseUnits("1000", await ClonedToken.decimals())
    );
  });
});
