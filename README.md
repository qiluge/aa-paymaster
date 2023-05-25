# aa-paymaster

account abstraction paymaster

## DepositPaymaster

source: https://github.com/eth-infinitism/account-abstraction/blob/develop/contracts/samples/DepositPaymaster.sol

- require deposit a little token to ensure that the tx fee can be deducted when tx revert
- require AA approve to depositPaymaster firstly

### deployments

#### bsc testnet

- paymaster: 0x9f797CbBB062dF37502E76dfCDF74367C796b92a
- USDT(test): 0x82dDd7cb91B377B3DaD5e9CF9A0C3e2FDF37fb59
- oracle: 0xd2eD759CA3fBC6277d0c140d670c62A78c6e3C49
- entry point: 0xF74cB5B29D1B16dA2C62f63c0701ea13f9231e0E
- account factory: 0xF4367445262600aCe64f59a921F829aE8d0F0426

### usage

- npm install
- npx hardhat compile
- `npx hardhat run ./scripts/deploy-deposit-paymaster.ts --network bsctest` to deploy paymaster
- modify variable of `./scripts/deploy-test-token-and-oracle.ts` with your specific and deployed DepositMaster address
- run `npx hardhat run ./scripts/deploy-test-token-and-oracle.ts --network bsctest` to deploy and config payment token
- replace `USDT` and `depositMaster` with your deployments at head of `./scripts/usage.ts`
- config your oracle and oracle dependency to your bundler whitelistContracts to enable SLOT-read check
- `npx hardhat run ./scripts/usage.ts --network bsctest` to send tx that used USDT as gas

## SponsorDepositPaymaster

Like [DepositPaymaster](#depositpaymaster)

source:

### deployments

#### bsc testnet

- paymaster: 0x33CAF88ee89fe7451d723438353455464d55E0fD
- USDT(test): 0x82dDd7cb91B377B3DaD5e9CF9A0C3e2FDF37fb59
- oracle: 0xd2eD759CA3fBC6277d0c140d670c62A78c6e3C49
- entry point: 0xF74cB5B29D1B16dA2C62f63c0701ea13f9231e0E
- account factory: 0xF4367445262600aCe64f59a921F829aE8d0F0426
