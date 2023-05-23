import {ethers} from "hardhat";

const {DepositPaymaster__factory} = require("./types/DepositPaymaster__factory");
const tokenName = "USDT test";
const tokenSymbol = "USDT";
const price = 1; // 1 ETH = 1 USDT
const paymaster = '0x9f797CbBB062dF37502E76dfCDF74367C796b92a';

async function deployTestTokenAndOracle() {
    const TestToken = await ethers.getContractFactory('TestToken');
    const testToken = await TestToken.deploy(tokenName, tokenSymbol);

    const TestOracle = await ethers.getContractFactory('TestOracle');
    const testOracle = await TestOracle.deploy(price);
    console.log("testToken: %s, testOracle: %s", testToken.address, testOracle.address);

    const [owner] = await ethers.getSigners();
    const depositPaymaster = await DepositPaymaster__factory.connect(paymaster, owner);
    await depositPaymaster.addToken(testToken.address, testOracle.address);
}

deployTestTokenAndOracle().then();