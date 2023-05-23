import {ethers} from "hardhat";
import {HttpRpcClient, PaymasterAPI, SimpleAccountAPI} from "@account-abstraction/sdk";
import {DepositPaymaster__factory} from "./types/DepositPaymaster__factory";
import {UserOperationStruct} from "@account-abstraction/contracts";

const USDT = '0x82dDd7cb91B377B3DaD5e9CF9A0C3e2FDF37fb59';
const depositMaster = '0x9f797CbBB062dF37502E76dfCDF74367C796b92a';
const entryPointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
const factoryAddress = '0x9406cc6185a346906296840746125a0e44976454';
const bundlerUrl = 'http://localhost:3000/rpc';

async function testPaymaster() {
    const [owner, acc] = await ethers.getSigners();
    const testToken = await ethers.getContractAt('TestToken', USDT);
    const paymaster = await DepositPaymaster__factory.connect(depositMaster, owner);
    const approve = await testToken.allowance(owner.address, depositMaster)
    if (approve.lt(1)) { // prepare some asset
        const tx = await testToken.approve(depositMaster, ethers.utils.parseEther('100000000000'))
        console.log('owner approve USDT to deposit paymaster, ', tx.hash);
        await tx.wait()
    }

    /* owner use approve to spend token */
    let ownerWallet = new SimpleAccountAPI({
        provider: ethers.provider,
        entryPointAddress,
        owner,
        factoryAddress,
    })
    const ownerAA = await ownerWallet.getAccountAddress()
    console.log('ownerAA', ownerAA);
    const ownerAAUSDTBalance = await testToken.balanceOf(ownerAA)
    if (ownerAAUSDTBalance.lt(ethers.utils.parseEther('10'))) {
        const tx = await testToken.transfer(ownerAA, ethers.utils.parseEther('100000000'))
        console.log('owner transfer 100000000 USDT to ownerAA, ', tx.hash);
        await tx.wait()
    }
    const ownerDepositInfo = await paymaster.depositInfo(USDT, ownerAA);
    if (ethers.utils.parseEther('10').gt(ownerDepositInfo.amount)) { // prepare deposit
        const tx = await paymaster.addDepositFor(testToken.address, ownerAA, ethers.utils.parseEther('10000'));
        console.log('owner deposit 10000 USDT, ', tx.hash);
        await tx.wait();
    }
    const bundlerProvider = new HttpRpcClient(bundlerUrl, entryPointAddress, ethers.provider.network.chainId)
    const allowance = await testToken.allowance(ownerAA, depositMaster)
    console.log('allowance of ownerAA to depositMaster, ', ethers.utils.formatEther(allowance));
    if (ethers.utils.parseEther('10').gt(allowance)) {
        const approveOP = await ownerWallet.createSignedUserOp({
            target: testToken.address,
            data: testToken.interface.encodeFunctionData('approve', [depositMaster, ethers.utils.parseEther('100000000000')]),
            maxFeePerGas: 0, maxPriorityFeePerGas: 0
        })
        const approveOPRes = await bundlerProvider.sendUserOpToBundler(approveOP);
        console.log('approve op, ', approveOPRes);
        const receipt = await ownerWallet.getUserOpReceipt(approveOPRes);
        if (!receipt) {
            console.log('approve failed!')
            return;
        }
        console.log('approve op receipt, ', receipt);
    }
    // specify paymasterAPI so that we can use deposit paymaster
    const paymasterAPI = new DepositPaymasterAPI(depositMaster, USDT);
    ownerWallet = new SimpleAccountAPI({
        provider: ethers.provider,
        entryPointAddress,
        owner,
        factoryAddress,
        paymasterAPI
    })
    const gasPrice = await ethers.provider.getGasPrice();
    // maxFeePerGas & maxPriorityFeePerGas should be same when chain doesn't support EIP-1559
    const unsignedTransferOP = await ownerWallet.createUnsignedUserOp({
        target: testToken.address,
        data: testToken.interface.encodeFunctionData('transfer', [acc.address, ethers.utils.parseEther('1')]),
        maxFeePerGas: gasPrice, maxPriorityFeePerGas: gasPrice
    })
    const op = await ownerWallet.signUserOp(unsignedTransferOP);
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

    constructor(address: string, toke: string) {
        super();
        this.addr = address;
        this.token = toke
    }

    async getPaymasterAndData(userOp: Partial<UserOperationStruct>): Promise<string | undefined> {
        return this.addr + this.token.substring(2);
    }
}

testPaymaster().then()