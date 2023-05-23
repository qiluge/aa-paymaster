import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import {NetworkUserConfig} from "hardhat/types";
import fs from 'fs'

const env = require('./env.json');


const mnemonic = fs.readFileSync(env.MNEMONIC_FILE, 'ascii').trim()

function getNetwork(url: string): NetworkUserConfig {
    return {
        url,
        accounts: {
            mnemonic
        }
    }
}

const config: HardhatUserConfig = {
    solidity: {
        compilers: [{
            version: '0.8.18',
            settings: {
                optimizer: {enabled: true, runs: 1000000}
            }
        }]
    },
    networks: {
        localhost: getNetwork('http://127.0.0.1:8545'),
        bsctest: getNetwork(`https://bsc.getblock.io/${env.GETBLOCK_ID}/testnet/`),
    },
};

export default config;
