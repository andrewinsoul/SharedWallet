const { expect } = require("chai");
const {
  ethers,
  waffle: { provider },
} = require("hardhat");
const parse2Int = require("../utils");

describe("Test Shared Wallet Contract", () => {
  let SharedWalletContract, sharedWallet, owner, addr1, addr2, ownerBalance;
  before(async () => {
    SharedWalletContract = await ethers.getContractFactory("SharedWallet");
    [owner, addr1, addr2] = await ethers.getSigners();
    sharedWallet = await SharedWalletContract.deploy();
    ownerBalance = parse2Int(await provider.getBalance(owner.address));
  });

  it("should ensure the balance of the shared wallet on creation is zero", async () => {
    let sharedWalletBalance = await sharedWallet.getWalletBalance();
    sharedWalletBalance = parse2Int(sharedWalletBalance);
    expect(sharedWalletBalance).to.equal(0);
  });

  it("should reject transaction if a customer first deposit is less than 0.03", async () => {
    try {
      await sharedWallet.connect(addr1).deposit({
        value: ethers.utils.parseEther("0.02"),
      });
    } catch (err) {
      expect(err.message).to.contains(
        "initial deposit must be at least 0.03 ETH"
      );
    }
  });

  it("should successfully deposit funds to the shared wallet and properly update the shared wallet and sender's balance and also add the depositor of the funds as a beneficiary if not already a beneficiary", async () => {
    const oldBalance = parse2Int(await provider.getBalance(addr1.address));
    await sharedWallet.connect(addr1).deposit({
      value: ethers.utils.parseEther("12"),
    });
    const newBalance = parse2Int(await provider.getBalance(addr1.address));
    const walletBalance = parse2Int(
      await provider.getBalance(sharedWallet.address)
    );

    expect(await sharedWallet.beneficiariyStatus(addr1.address)).to.equal(true);
    expect(walletBalance).to.equal(12);
    expect((oldBalance - newBalance).toFixed(0)).to.equal("12");
  });

  it("should prevent beneficiary to make withdrawal if the amount to withdraw is greater than withdrawal limit", async () => {
    try {
      await sharedWallet.connect(addr1).withdraw(`${12e18}`);
    } catch (error) {
      const { message } = error;
      expect(message).contains("exceeded your available limit for withdrawal");
    }
  });

  it("should allow beneficiary to make withdrawal and update the balance of the wallet and the address that made the withdrawal", async () => {
    const addrOneOldBal = parse2Int(await provider.getBalance(addr1.address));
    const walletOldBal = parse2Int(
      await provider.getBalance(sharedWallet.address)
    );
    await sharedWallet.connect(addr1).withdraw(`${2e18}`);
    const addrOneNewBal = parse2Int(await provider.getBalance(addr1.address));
    const walletNewBal = parse2Int(
      await provider.getBalance(sharedWallet.address)
    );
    expect(Math.ceil(addrOneNewBal - addrOneOldBal)).to.equal(2);
    expect(Math.ceil(walletOldBal - walletNewBal)).to.equal(2);
  });

  it("should prevent beneficiary to make withdrawal if he tries to withdraw when he does not have at least 0.5 ETH", async () => {
    try {
      await sharedWallet.connect(addr2).deposit({
        value: ethers.utils.parseEther("0.2"),
      });
      await sharedWallet.connect(addr2).withdraw(`${1e18}`);
    } catch (error) {
      let { message } = error;
      expect(message).contains(
        "you need to have at least 0.5 ETH before you can withdraw"
      );
    }
  });

  it("should prevent beneficiary from withdrawing funds if it is not up to a month before the previous withdrawal. You can only withdraw once per month", async () => {
    try {
      await sharedWallet.connect(addr1).withdraw(`${2e18}`);
    } catch (error) {
      const { message } = error;
      expect(message).contains(
        "wait a month before you can make another withdrawal"
      );
    }
  });

  it("should only allow the owner of the shared wallet withdraw his profit", async () => {
    await sharedWallet.withdrawMyProfit(`${6e16}`);
    const newSharedWalletProfitBalance =
      await sharedWallet.retrieveSharedWalletProfit();
    const newOwnerBalance = parse2Int(await provider.getBalance(owner.address));
    expect((newOwnerBalance - ownerBalance).toFixed(2)).to.equal("0.06");
    expect(newSharedWalletProfitBalance).to.equal(0);
  });
});
