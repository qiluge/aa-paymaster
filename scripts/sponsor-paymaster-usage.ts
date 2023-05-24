import {ethers} from "hardhat";
import {HttpRpcClient, PaymasterAPI, SimpleAccountAPI} from "@account-abstraction/sdk";
import {DepositPaymaster__factory} from "./types/DepositPaymaster__factory";
import {UserOperationStruct} from "@account-abstraction/contracts";
import {SponsorDepositPaymaster__factory} from "./types/SponsorDepositPaymaster__factory";

const USDT = '0x82dDd7cb91B377B3DaD5e9CF9A0C3e2FDF37fb59';
const depositMaster = '0x74a776801CDfA426475AA93a2f9c2fb586196cbB';
const entryPointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
const factoryAddress = '0x9406cc6185a346906296840746125a0e44976454';
const bundlerUrl = 'http://localhost:3000/rpc';

async function testPaymaster() {
    /* pre config */
    const [owner, acc] = await ethers.getSigners();
    const testToken = await ethers.getContractAt('TestToken', USDT);
    const paymaster = await SponsorDepositPaymaster__factory.connect(depositMaster, owner);
    const ownerPaymasterAllowance = await testToken.allowance(owner.address, depositMaster)
    if (ownerPaymasterAllowance.lt(1)) { // prepare some asset
        const tx = await testToken.approve(depositMaster, ethers.utils.parseEther('100000000000'))
        console.log('owner approve USDT to deposit paymaster, ', tx.hash);
        await tx.wait()
    }
    /* acc as sponsor */
    // acc deposit and approve to paymaster
    const depositInfo = await paymaster.depositInfo(USDT, acc.address);
    console.log('depositInfo', depositInfo.amount.toString());
    if (depositInfo.amount.lt(1)) {
        const tx = await paymaster.addDepositFor(USDT, acc.address, ethers.utils.parseEther('19999'));
        console.log('deposit USDT to deposit paymaster for acc, ', tx.hash);
        await tx.wait()
    }
    const accPaymasterAllowance = await testToken.allowance(acc.address, depositMaster)
    console.log('accPaymasterAllowance', accPaymasterAllowance.toString())
    if (accPaymasterAllowance.lt(1)) { // prepare some asset
        const tx = await testToken.connect(acc).approve(depositMaster, ethers.utils.parseEther('100000000000'))
        console.log('acc approve USDT to deposit paymaster, ', tx.hash);
        await tx.wait()
    }
    /* owner use approve to spend token */
    // specify paymasterAPI so that we can use deposit paymaster
    // use acc as sponsor
    const paymasterAPI = new DepositPaymasterAPI(depositMaster, USDT, acc.address);
    const ownerWallet = new SimpleAccountAPI({
        provider: ethers.provider,
        entryPointAddress,
        owner,
        factoryAddress,
        paymasterAPI
    })
    const ownerAA = await ownerWallet.getAccountAddress()
    console.log('ownerAA', ownerAA);
    const ownerAAUSDTBalance = await testToken.balanceOf(ownerAA)
    if (ownerAAUSDTBalance.lt(ethers.utils.parseEther('10'))) {
        const tx = await testToken.transfer(ownerAA, ethers.utils.parseEther('100000000'))
        console.log('owner transfer 100000000 USDT to ownerAA, ', tx.hash);
        await tx.wait()
    }
    // check sponsor allownce
    const sponsorAllowance = await paymaster.sponsors(acc.address, USDT, ownerAA);
    console.log('sponsorAllowance', sponsorAllowance.toString())
    if (sponsorAllowance.lt(1)) {
        const tx = await paymaster.connect(acc).setSponsors(USDT, [ownerAA], [ethers.utils.parseEther('19999999')]);
        console.log('acc set sponsor allowance, ', tx.hash);
        await tx.wait()
    }
    const ownerDepositInfo = await paymaster.depositInfo(USDT, ownerAA);
    if (ethers.utils.parseEther('10').gt(ownerDepositInfo.amount)) { // prepare deposit
        const tx = await paymaster.addDepositFor(testToken.address, ownerAA, ethers.utils.parseEther('10000'));
        console.log('owner deposit 10000 USDT, ', tx.hash);
        await tx.wait();
    }
    const bundlerProvider = new HttpRpcClient(bundlerUrl, entryPointAddress, ethers.provider.network.chainId)
    const gasPrice = await ethers.provider.getGasPrice();
    // maxFeePerGas & maxPriorityFeePerGas should be same when chain doesn't support EIP-1559
    const unsignedTransferOP = await ownerWallet.createUnsignedUserOp({
        target: testToken.address,
        data: testToken.interface.encodeFunctionData('transfer', [acc.address, ethers.utils.parseEther('1')]),
        maxFeePerGas: gasPrice, maxPriorityFeePerGas: gasPrice
    })
    const op = await ownerWallet.signUserOp(unsignedTransferOP);
    console.log(op);
    const res = await bundlerProvider.sendUserOpToBundler(op);
    console.log('owner transfer 1 USDT(test) to acc, ', res);
    const bundle = await ownerWallet.getUserOpReceipt(res);
    if (!bundle) {
        console.log('owner transfer 1 USDT(test) to acc failed!');
        return
    }
    console.log('owner transfer 1 USDT(test) to acc receipt, ', bundle);
}

class DepositPaymasterAPI extends PaymasterAPI {
    addr: string
    token: string
    sponsor: string

    constructor(address: string, toke: string, sponsor: string) {
        super();
        this.addr = address;
        this.token = toke;
        this.sponsor = sponsor
    }

    async getPaymasterAndData(userOp: Partial<UserOperationStruct>): Promise<string | undefined> {
        return this.addr + this.token.substring(2) + this.sponsor.substring(2);
    }
}

testPaymaster().then()
