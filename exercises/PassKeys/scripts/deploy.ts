import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contract with:", deployer.address);

    // You should specify the correct EntryPoint address here
    const entryPointAddress = "0xYourEntryPointAddress"; // Replace with actual EntryPoint address

    // Deploy the PasskeyAccount contract
    const PasskeyAccount = await ethers.getContractFactory("PasskeyAccount");
    const account = await PasskeyAccount.deploy(deployer.address, entryPointAddress);

    await account.deployed();

    console.log("PasskeyAccount deployed at:", account.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

