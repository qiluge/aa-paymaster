import {ethers} from "hardhat";
import {HttpRpcClient, PaymasterAPI, SimpleAccountAPI} from "@account-abstraction/sdk";
import {DepositPaymaster__factory} from "./types/DepositPaymaster__factory";
import {UserOperationStruct} from "@account-abstraction/contracts";
import {SponsorDepositPaymaster__factory} from "./types/SponsorDepositPaymaster__factory";
import {ERC20__factory} from "../typechain-types";
import {QuotaPaymaster__factory} from "./types/QuotaPaymaster__factory";

const USDT = '0x82dDd7cb91B377B3DaD5e9CF9A0C3e2FDF37fb59';
const paymasterAddr = '0x11A07D7844c977d5Eb986c635a9F65b22D5Dd74d';
const entryPointAddress = '0xF74cB5B29D1B16dA2C62f63c0701ea13f9231e0E';
const factoryAddress = '0xF4367445262600aCe64f59a921F829aE8d0F0426';
const bundlerUrl = 'http://localhost:3000/rpc';

async function testPaymaster() {
    /* pre config */
    const [owner, acc] = await ethers.getSigners();

    /* owner use approve to spend token */
    // specify paymasterAPI so that we can use deposit paymaster
    // use acc as sponsor
    // const paymasterAPI = new QuotaPaymaster(paymasterAddr);
    const accWallet = new SimpleAccountAPI({
        provider: ethers.provider,
        entryPointAddress,
        owner,
        factoryAddress,
        // paymasterAPI
    })
    const accAA = await accWallet.getAccountAddress()
    console.log('accAA', accAA);
    /* check quotas */
    const paymaster = await new QuotaPaymaster__factory(owner).attach(paymasterAddr)
    const quota = await paymaster.quotas(accAA);
    console.log('quota: ', quota.toString());
    if (quota.lt(1)) {
        const tx = await paymaster.configQuota([accAA], [ethers.utils.parseEther('10000')]);
        console.log('config 10000 quota to accAA, ', tx.hash);
        await tx.wait()
    }
    /* check USDT balance */
    const testToken = await ERC20__factory.connect(USDT, owner);
    const accAAUSDTBalance = await testToken.balanceOf(accAA)
    console.log('accAA USDT balance: ', accAAUSDTBalance.toString())
    if (accAAUSDTBalance.lt(ethers.utils.parseEther('10'))) {
        const tx = await testToken.transfer(accAA, ethers.utils.parseEther('100000000'))
        console.log('owner transfer 100000000 USDT to accAA, ', tx.hash);
        await tx.wait()
    }
    const bundlerProvider = new HttpRpcClient(bundlerUrl, entryPointAddress, ethers.provider.network.chainId)
    const gasPrice = await ethers.provider.getGasPrice();
    // maxFeePerGas & maxPriorityFeePerGas should be same when chain doesn't support EIP-1559
    const op = await accWallet.createSignedUserOp({
        target: testToken.address,
        data: testToken.interface.encodeFunctionData('transfer', [acc.address, ethers.utils.parseEther('1')]),
        maxFeePerGas: gasPrice, maxPriorityFeePerGas: gasPrice
    });
    console.log(op);
    const res = await bundlerProvider.sendUserOpToBundler(op);
    console.log('owner transfer 1 USDT(test) to acc, ', res);
    const bundle = await accWallet.getUserOpReceipt(res);
    if (!bundle) {
        console.log('owner transfer 1 USDT(test) to acc failed!');
        return
    }
    console.log('owner transfer 1 USDT(test) to acc receipt, ', bundle);
}

class QuotaPaymaster extends PaymasterAPI {
    addr: string

    constructor(address: string) {
        super();
        this.addr = address;
    }

    async getPaymasterAndData(userOp: Partial<UserOperationStruct>): Promise<string | undefined> {
        return this.addr;
    }
}

testPaymaster().then()
