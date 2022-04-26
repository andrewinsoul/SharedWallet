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

  it("should successfully deposit funds to the shared wallet and properly update the shared wallet and sender's balance ", async () => {
    await sharedWallet.deposit({
      value: ethers.utils.parseEther("12"),
    });
    const newOwnerBalance = parse2Int(await provider.getBalance(owner.address));
    const walletBalance = parse2Int(
      await provider.getBalance(sharedWallet.address)
    );
    expect(walletBalance).to.equal(12);
    expect((ownerBalance - newOwnerBalance).toFixed(0)).to.equal("12");
  });

  it("should reject the transaction when an address that is not the wallet owner tries to add a beneficiary", async () => {
    try {
      await sharedWallet.connect(addr1).addBeneficiary(addr2.address);
    } catch (error) {
      let { message } = error;
      message = message.split(":");
      expect(message[1].split("'")[1].trim().toLowerCase()).to.equal(
        "only the owner of the wallet can perform this operation"
      );
    }
  });

  it("should reject the transaction when an address that is not the wallet owner tries to remove a beneficiary", async () => {
    try {
      await sharedWallet.connect(addr1).removeBeneficiary(addr2.address);
    } catch (error) {
      let { message } = error;
      message = message.split(":");
      expect(message[1].split("'")[1].trim().toLowerCase()).to.equal(
        "only the owner of the wallet can perform this operation"
      );
    }
  });

  it("should add beneficiary when the owner of the wallets add another address as beneficiary", async () => {
    await sharedWallet.addBeneficiary(addr1.address);
    expect(await sharedWallet.beneficiaries(addr1.address)).to.equal(1);
  });

  it("should prevent beneficiary to make withdrawal if the amount to withdraw is greater than the balance of the wallet", async () => {
    try {
      await sharedWallet.connect(addr1).withdraw(`${80e18}`);
    } catch (error) {
      let { message } = error;
      message = message.split(":");
      expect(message[1].split("'")[1].trim().toLowerCase()).to.equal(
        "there is not enough balance in the wallet"
      );
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

  it("should prevent beneficiary to make withdrawal if it is not up to 24 hours after initial withdrawal", async () => {
    try {
      await sharedWallet.connect(addr1).withdraw(`${2e18}`);
    } catch (error) {
      let { message } = error;
      message = message.split(":");
      expect(message[1].split("'")[1].trim().toLowerCase()).to.equal(
        "try again in 24 hours"
      );
    }
  });

  it("should remove a beneficiary when the owner of the wallet removes a beneficiary", async () => {
    await sharedWallet.removeBeneficiary(addr1.address);
    expect(await sharedWallet.beneficiaries(addr1.address)).to.equal(0);
  });

  it("should verify the owner of the wallet is not bounded by the 24 hr mark i.e the owner of the wallet can withdraw anytime", async () => {
    const ownerOldBal = parse2Int(await provider.getBalance(owner.address));
    const walletOldBal = parse2Int(
      await provider.getBalance(sharedWallet.address)
    );
    await sharedWallet.withdraw(`${2e18}`);
    await sharedWallet.withdraw(`${2e18}`);
    const ownerNewBal = parse2Int(await provider.getBalance(owner.address));
    const walletNewBal = parse2Int(
      await provider.getBalance(sharedWallet.address)
    );
    expect(Math.ceil(ownerNewBal - ownerOldBal)).to.equal(4);
    expect(Math.ceil(walletOldBal - walletNewBal)).to.equal(4);
  });

  it("should reject the transaction when an address that is not a beneficiary tries to make a withdrawal", async () => {
    try {
      await sharedWallet.connect(addr1).withdraw(`${2e18}`);
    } catch (error) {
      let { message } = error;
      message = message.split(":");
      expect(message[1].split("'")[1].trim().toLowerCase()).to.equal(
        "You are not part of the beneficiaries, so you cannot withdraw"
          .trim()
          .toLowerCase()
      );
    }
  });
});
