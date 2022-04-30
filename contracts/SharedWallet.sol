// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
This is a smart contract that implements the idea of a shared wallet. The owner of the wallet can add beneficiaries to the wallet and each beneficiary can only withdraw once a day. Anyone can deposit into the wallet but only beneficaries added by the wallet owner can withdraw from the wallet
 */

contract SharedWallet is Ownable {
    uint256 balance;
    uint256 sharedWalletProfit;
    address sharedWalletOwner;

    constructor() {
        balance = address(this).balance;
        beneficiariyStatus[msg.sender] = true;
        sharedWalletOwner = msg.sender;
    }

    event AddBeneficiaryEvent(address indexed beneficiary, uint256 timestamp);
    event WithdrawTransferEvent(
        address indexed _from,
        address indexed _to,
        uint256 amount
    );
    event WithdrawProfitTransferEvent(
        address indexed _from,
        address indexed _to,
        uint256 amount
    );
    event DepositTransferEvent(
        address indexed _from,
        address indexed _to,
        uint256 amount
    );

    mapping(address => uint256) public beneficiaries;
    mapping(address => bool) public beneficiariyStatus;
    mapping(address => uint256) public beneficiaryWithdrawalTimestamps;

    modifier checkWithdrawalPermission(uint256 amount) {
        require(
            beneficiariyStatus[msg.sender],
            "You are not part of the beneficiaries, so you cannot withdraw. To become a beneficiary, just deposit to the wallet"
        );
        require(balance >= amount, "There is not enough balance in the wallet");
        require(
            beneficiaries[msg.sender] >= 0.5 * 10**18,
            "You have not deposited enough, you need to have at least 0.5 ETH before you can withdraw"
        );
        require(
            beneficiaries[msg.sender] - amount >= 0.03 * 10**18,
            "You have exceeded your available limit for withdrawal (0.03 ETH is subtracted from your balance for maintenance of the shared wallet)"
        );
        require(
            block.timestamp - beneficiaryWithdrawalTimestamps[msg.sender] >
                2.628 * 10**6,
            "You need to wait a month before you can make another withdrawal"
        );
        _;
    }

    function withdraw(uint256 amount) public checkWithdrawalPermission(amount) {
        balance -= amount;
        beneficiaries[msg.sender] -= amount;
        beneficiaryWithdrawalTimestamps[msg.sender] = block.timestamp;
        payable(msg.sender).transfer(amount);
        emit WithdrawTransferEvent(address(this), msg.sender, amount);
    }

    function withdrawMyProfit(uint256 amount) public onlyOwner {
        require(
            sharedWalletProfit >= amount,
            "you cannot withdraw more than your profit"
        );
        sharedWalletProfit -= amount;
        payable(sharedWalletOwner).transfer(amount);
        emit WithdrawProfitTransferEvent(address(this), msg.sender, amount);
    }

    function addBeneficiary(uint256 initialDeposit) private {
        if (!beneficiariyStatus[msg.sender]) {
            require(
                initialDeposit >= 0.03 * 10**18,
                "Your initial deposit must be at least 0.03 ETH"
            );
            beneficiariyStatus[msg.sender] = true;
            sharedWalletProfit += 0.03 * 10**18;
            emit AddBeneficiaryEvent(msg.sender, block.timestamp);
        }
    }

    function getWalletBalance() public view returns (uint256) {
        return balance;
    }

    function getSharedWalletOwnerAddress() public view returns (address) {
        return owner();
    }

    function getMyWalletAddress() public view returns (address) {
        return msg.sender;
    }

    function deposit() public payable {
        require(msg.value != 0, "You need to deposit some amount of money!");
        balance += msg.value;
        beneficiaries[msg.sender] += msg.value;
        addBeneficiary(msg.value);
        emit DepositTransferEvent(msg.sender, address(this), msg.value);
    }

    function retrieveSharedWalletProfit() public view returns (uint256) {
        return sharedWalletProfit;
    }
}
