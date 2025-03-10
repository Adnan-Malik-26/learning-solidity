import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

async function deployContractsFixture() {
    const [owner] = await hre.ethers.getSigners();
    
    const LogicContract = await hre.ethers.getContractFactory("LogicContract");
    const logic = await LogicContract.deploy();
    await logic.waitForDeployment();

    const ProxyContract = await hre.ethers.getContractFactory("ProxyContract");
    const proxy = await ProxyContract.deploy();
    await proxy.waitForDeployment();

    return { logic, proxy, owner };
}

describe("DelegateCall Test", function () {
    it("Should update ProxyContract's storage and not LogicContract's", async function () {
        const { logic, proxy } = await loadFixture(deployContractsFixture);
        
        const logicAddress = await logic.getAddress();
        const proxyAddress = await proxy.getAddress();

        expect(await proxy.number()).to.equal(0);
        expect(await logic.number()).to.equal(0);

        const tx = await proxy.executeDelegateCall(logicAddress, 42);
        await tx.wait();

        expect(await proxy.number()).to.equal(42);

        expect(await logic.number()).to.equal(0);
    });
});
