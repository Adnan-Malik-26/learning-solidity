const hre = require("hardhat");

async function main() {
  const ep = await hre.ethers.deployContract("EntryPoint");
  
  const userOp = {
    sender,
    nonce,
    initCode,
    callData,
    accountGasLimits: 200_000,
    preVerificationGas: 200_000,
    gasFees: 200_000,
    paymasterAndData: "0x",
    signature: "0x"
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
