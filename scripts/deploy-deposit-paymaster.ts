import {ethers} from "hardhat";
import {DepositPaymaster__factory} from "./types/DepositPaymaster__factory";
import {EntryPoint__factory} from "./types/EntryPoint__factory";

async function deployDepositPaymaster() {
    const [signer] = await ethers.getSigners();
    const entryPoint = await new EntryPoint__factory(signer).attach('0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789');
    const paymaster = await new DepositPaymaster__factory(signer).deploy(entryPoint.address)
    console.log(paymaster.address);
    await paymaster.deployed();
    // paymaster should stake at entry point
    await paymaster.addStake(1000000, {value: ethers.utils.parseEther('0.1')})
    await entryPoint.depositTo(paymaster.address, {value: ethers.utils.parseEther('0.1')})
}

deployDepositPaymaster().then()
