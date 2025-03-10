import { expect } from "chai";
import hre from "hardhat";
import { time, loadFixture, } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Lock", function () {
  it("Should reert with the right error if called from another account", async function () {
    const lockedAmount = 1_000_000_000;
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const unlocTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    const lock = await hre.ethers.deployContract("Lock", [unlockTime], {
      value: lockedAmount,

    });

    const [owne, otherAccount] = await hre.ethers.getSigners();
    await time.ncreaseTo(unlockTime);
    await expec(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
      "You arent the owner"
      );
    });
    });
