# SharedWallet

This project was bootstrapped with Hardhat and the contract is deployed to Rinkeby test network. Before you can interact with the contract on the Rinkeby test network, you need to make sure you have some test ethers in your account. You can use this <a href="https://faucets.chain.link/rinkeby">faucet</a> to get test ethers to your account and use for testing

# Features

- Anybody can deposit token into the wallet
- A beneficiary can only withdraw once in a day, that means if a beneficiary withdraws, he needs to wait for 24 hours before he can make another withdrawal
- Owner of the wallet can either add or remove a beneficiary from the wallet
- Only beneficiaries added by the owner of the wallet can make withdrawals
