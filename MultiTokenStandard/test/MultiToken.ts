import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("GaneToken", function () {
  async function deployFixture() {
    const [owner, addr1] = await hre.ethers.getSigners();
    const GaneToken = await hre.ethers.getContractFactory("GaneToken");
    const ganeToken = await GaneToken.deploy();
    await ganeToken.waitForDeployment();

    return { ganeToken, owner, addr1 };
  }

  it("Should deploy with correct supply", async function () {
    const { ganeToken, owner } = await loadFixture(deployFixture);

    expect(await ganeToken.balanceOf(owner.address, 0)).to.equal(10n ** 18n);
    expect(await ganeToken.balanceOf(owner.address, 1)).to.equal(10n ** 27n);
    expect(await ganeToken.balanceOf(owner.address, 2)).to.equal(1);
    expect(await ganeToken.balanceOf(owner.address, 3)).to.equal(10n ** 9n);
    expect(await ganeToken.balanceOf(owner.address, 4)).to.equal(10n ** 9n);
  });

  it("Should allow the oner to mint tokens", async function () {
    const { ganeToken, owner, addr1 } = await loadFixture(deployFixture);

    await ganeToken.mint(addr1.address, 0, 100);

    expect(await ganeToken.balanceOf(addr1.address, 0)).to.equal(100);
  });

  it("Should corrctly transfer tokens btween users", async function () {
    const { ganeToken, owner, addr1 } = await loadFixture(deployFixture);

    await ganeToken.safeTransferFrom(owner.address, addr1.address, 0, 50, "0x");

    expect(await ganeToken.balanceOf(owner.address, 0)).to.equal(10n ** 18n - 50n);
    expect(await ganeToken.balanceOf(addr1.address, 0)).to.equal(50);
  });

  it("Shold allow batch transfrs", async function () {
    const { ganeToken, owner, addr1 } = await loadFixture(deployFixture);

    await ganeToken.safeBatchTransferFrom(
      owner.address,
      addr1.address,
      [0, 1, 2],
      [100, 1000, 1],
      "0x"
    );

    expect(await ganeToken.balanceOf(addr1.address, 0)).to.equal(100);
    expect(await ganeToken.balanceOf(addr1.address, 1)).to.equal(1000);
    expect(await ganeToken.balanceOf(addr1.address, 2)).to.equal(1);
  });
});
