import {ethers} from "hardhat";
import {EntryPoint__factory} from "./types/EntryPoint__factory";
import {QuotaPaymaster__factory} from "./types/QuotaPaymaster__factory";

const entryPointAddr = '0xF74cB5B29D1B16dA2C62f63c0701ea13f9231e0E';

async function deployAllowancePaymaster() {
    const [signer] = await ethers.getSigners();
    const entryPoint = await new EntryPoint__factory(signer).attach(entryPointAddr);
    const paymaster = await new QuotaPaymaster__factory(signer).deploy(entryPoint.address)
    console.log(paymaster.address);
    await paymaster.deployed();
    // paymaster should stake at entry point
    await paymaster.addStake(1000000, {value: ethers.utils.parseEther('0.01')})
    await entryPoint.depositTo(paymaster.address, {value: ethers.utils.parseEther('0.01')})
}

deployAllowancePaymaster().then()
