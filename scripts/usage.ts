import {ethers} from "hardhat";
import {HttpRpcClient, PaymasterAPI, SimpleAccountAPI} from "@account-abstraction/sdk";
import {DepositPaymaster__factory} from "./types/DepositPaymaster__factory";
import {Deferrable} from "@ethersproject/properties/src.ts";
import {Result} from "@ethersproject/abi";
import {UserOperationStruct} from "@account-abstraction/contracts";

const USDT = '0x82dDd7cb91B377B3DaD5e9CF9A0C3e2FDF37fb59';
const depositMaster = '0x9f797CbBB062dF37502E76dfCDF74367C796b92a';
const entryPointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
const factoryAddress = '0x9406cc6185a346906296840746125a0e44976454';
const bundlerUrl = 'http://localhost:3000/rpc';

async function testPaymaster() {
    const [owner, acc] = await ethers.getSigners();
    const testToken = await ethers.getContractAt('TestToken', USDT);
    /* prepare USDT(test) */
    const accUSDTBalance = await testToken.balanceOf(acc.address);
    if (ethers.utils.parseEther('10').gt(accUSDTBalance)) {
        const tx = await testToken.transfer(acc.address, ethers.utils.parseEther('100000000'))
        console.log('owner transfer 100000000 USDT to acc, ', tx.hash);
    }
    /* owner use approve to spend token */
    const allowance = await testToken.allowance(owner.address, depositMaster)
    if (ethers.utils.parseEther('10').gt(allowance)) {
        const tx = await testToken.approve(depositMaster, ethers.utils.parseEther('100000000000000000000000000000000'))
        console.log('owner approve USDT to paymaster, ', tx.hash);
    }
    const paymasterAPI = new DepositPaymasterAPI(depositMaster, USDT);
    const walletAPI = new SimpleAccountAPI({
        provider: ethers.provider,
        entryPointAddress,
        owner,
        factoryAddress,
        paymasterAPI
    })
    const address = await walletAPI.getAccountAddress()
    // TODO: transfer to AA and let AA approve to paymaster
    await testToken.transfer(address, ethers.utils.parseEther('10000'));

    const unsignedTransferOP = await walletAPI.createUnsignedUserOp({
        target: testToken.address,
        data: testToken.interface.encodeFunctionData('transfer', [acc.address, ethers.utils.parseEther('1')]),
        maxFeePerGas: 0, maxPriorityFeePerGas: 0
    })
    const op = await walletAPI.signUserOp(unsignedTransferOP);
    const bundlerProvider = new HttpRpcClient(bundlerUrl, entryPointAddress, ethers.provider.network.chainId)
    const res = await bundlerProvider.sendUserOpToBundler(op);
    console.log('owner transfer 1 USDT(test) to acc, ', res);
    /* account deposit USDT to spend, not approve */
    const paymaster = await DepositPaymaster__factory.connect(depositMaster, acc);
    // TODO: deposit for AA, not EOA
    const tx = await paymaster.addDepositFor(testToken.address, acc.address, ethers.utils.parseEther('100'));
    console.log('acc deposit 100 USDT, ', tx.hash);
    await tx.wait();
    const walletAPI1 = new SimpleAccountAPI({
        provider: ethers.provider,
        entryPointAddress,
        owner: acc,
        factoryAddress,
        paymasterAPI
    })
    const op1 = await walletAPI.signUserOp(unsignedTransferOP);
    const res1 = await bundlerProvider.sendUserOpToBundler(op1);
    console.log('acc transfer 1 USDT(test) to self, ', res1);

    const bundle = await walletAPI.getUserOpReceipt(res);
    console.log('owner transfer 1 USDT(test) to acc receipt, ', bundle);
    const bundle1 = await walletAPI1.getUserOpReceipt(res1);
    console.log('acc transfer 1 USDT(test) to self receipt, ', bundle1);
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