import {ethers} from "hardhat";
import {DepositPaymaster__factory} from "./types/DepositPaymaster__factory";

const tokenAddr = '0x82dDd7cb91B377B3DaD5e9CF9A0C3e2FDF37fb59';
const oracleAddr = '0xd2eD759CA3fBC6277d0c140d670c62A78c6e3C49';
const paymasterAddr = '';

async function configDepositPaymaster() {
    const [signer] = await ethers.getSigners();
    const depositPaymaster = await DepositPaymaster__factory.connect(paymasterAddr, signer);
    await depositPaymaster.addToken(tokenAddr, oracleAddr);
}

configDepositPaymaster().then()
