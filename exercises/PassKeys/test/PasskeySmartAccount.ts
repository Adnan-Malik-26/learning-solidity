import { expect } from "chai";
import { ethers } from "hardhat";

const deployFixture = async () => {
  const [deployer] = await ethers.getSigners();

  const Entrypoint = await ethers.getContractFactory("EntryPoint");
  Entrypoint = await Entrypoint.deploy();
  await Entrypoint.deployed();

  // Deploy SecondContract with the address of FirstContract
  const PasskeySmartAccount = await ethers.getContractFactory("PasskeySmartAccount");
  PasskeySmartAccount = await PasskeySmartAccount.deploy(Entrypoint.address);
  await PasskeySmartAccount.deployed();
};

describe("Interaction between FirstContract and SecondContract", function () {
  beforeEach(async function () {
    await deployFixture();
  });

});

