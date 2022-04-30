# SharedWallet

This project was bootstrapped with Hardhat and the contract is deployed to Rinkeby test network. Before you can interact with the contract on the Rinkeby test network, you need to make sure you have some test ethers in your account. You can use this <a href="https://faucets.chain.link/rinkeby">faucet</a> to get test ethers to your account and use for testing

# Features

- Only beneficiaries can withdraw from the wallet

- Anybody can deposit token into the wallet. If you deposit to the wallet for your first time, you automatically become a beneficiary. It should be noted that 0.03 ETH is removed from your first deposit and this is the minimal to deposit for your first time.

- A beneficiary can only withdraw once a month and must have a deposit of at least 0.5 ETH to withdraw

- Only the owner of the shared wallet has access to the 0.03 ETH that is subtracted from every beneficiary the first time they deposit into the wallet

# TEST

All the features of the smart contract was tested. To run the test suite, run the command: `npm test`
