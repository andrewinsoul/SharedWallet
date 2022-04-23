// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

/**
This is a smart contract that implements the idea of a shared wallet. The owner of the wallet can add beneficiaries to the wallet and each beneficiary can only withdraw once a day. Anyone can deposit into the wallet but only beneficaries added by the wallet owner can withdraw from the wallet
 */

contract SharedWallet {
    uint256 balance;
    address owner;

    constructor() {
        balance = address(this).balance;
        owner = msg.sender;
    }

    event DepositEvent(uint256 amount);
    event AddBeneficiaryEvent(address beneficiary);
    event RemoveBeneficiaryEvent(address beneficiary);
    event WithdrawEvent(address beneficary, uint256 amount);

    mapping(address => uint256) public beneficiaries;

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only the owner of the wallet can perform this operation"
        );
        _;
    }

    modifier checkWithdrawalPermission(uint256 amount) {
        require(
            beneficiaries[msg.sender] >= 1,
            "You are not part of the beneficiaries, so you can't withdraw"
        );
        require(balance >= amount, "There is not enough balance in the wallet");
        require(
            block.timestamp - beneficiaries[msg.sender] > 86400 ||
                beneficiaries[msg.sender] == 1,
            "Try again in 24 hours"
        );
        _;
    }

    function withdraw(uint256 amount) public checkWithdrawalPermission(amount) {
        balance -= amount;
        beneficiaries[msg.sender] = block.timestamp;
        payable(msg.sender).transfer(amount);
        emit WithdrawEvent(msg.sender, amount);
    }

    function addBeneficiary(address beneficiaryAddress) public onlyOwner {
        require(
            beneficiaries[beneficiaryAddress] == 0,
            "Beneficiary already exists"
        );
        beneficiaries[beneficiaryAddress] = 1;
        emit AddBeneficiaryEvent(beneficiaryAddress);
    }

    function removeBeneficiary(address beneficiaryAddress) public onlyOwner {
        beneficiaries[beneficiaryAddress] = 0;
        emit RemoveBeneficiaryEvent(beneficiaryAddress);
    }

    function getWalletBalance() public view returns (uint256) {
        return balance;
    }

    receive() external payable {
        balance += msg.value;
        emit DepositEvent(msg.value);
    }
}
