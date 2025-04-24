import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the EntryPoint address (replace this with the actual address of your EntryPoint contract)
  const entryPointAddress = "0xYourEntryPointAddressHere";

  // Deploy the MinimalAccount contract
  const MinimalAccount = await ethers.getContractFactory("MinimalAccount");
  const minimalAccount = await MinimalAccount.deploy(entryPointAddress, deployer.address);
  await minimalAccount.deployed();

  console.log("MinimalAccount deployed to:", minimalAccount.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

