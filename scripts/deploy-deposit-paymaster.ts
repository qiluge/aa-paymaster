import {ethers} from "hardhat";
import {DepositPaymaster__factory} from "./types/DepositPaymaster__factory";
import {EntryPoint__factory} from "./types/EntryPoint__factory";

const entryPointAddr = '0xF74cB5B29D1B16dA2C62f63c0701ea13f9231e0E';
async function deployDepositPaymaster() {
    const [signer] = await ethers.getSigners();
    const entryPoint = await new EntryPoint__factory(signer).attach(entryPointAddr);
    const paymaster = await new DepositPaymaster__factory(signer).deploy(entryPoint.address)
    console.log(paymaster.address);
    await paymaster.deployed();
    // paymaster should stake at entry point
    await paymaster.addStake(1000000, {value: ethers.utils.parseEther('0.1')})
    await entryPoint.depositTo(paymaster.address, {value: ethers.utils.parseEther('0.1')})
}

deployDepositPaymaster().then()
