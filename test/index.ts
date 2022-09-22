import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { signERC2612Permit } from "eth-permit";

import { expect } from "chai";
import { ethers } from "hardhat";
import { erc20 } from "../typechain-types/@openzeppelin/contracts/token";
import { UMToken } from "../typechain-types";
const { waffle } = require("hardhat");

describe("Test suite", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, secondAccount, otherAccount] = await ethers.getSigners();

    const ERC20 = await ethers.getContractFactory("UMToken");
    const erc20:UMToken = await ERC20.deploy();

    return { erc20, owner, otherAccount, secondAccount };
  }

  const getBalance = async (tokenContract: UMToken, address: string) => {
    return Number(await tokenContract.balanceOf(address)) / 10 ** 18;
  };

  const getAllowance = async (
    tokenContract: UMToken,
    ownerAddress: string,
    spenderAddress: string
  ) => {
    return (
      Number(await tokenContract.allowance(ownerAddress, spenderAddress)) /
      10 ** 18
    );
  };

  describe("Deployment", function () {
    it.only("Should permit to transfer to other account", async function () {
      const { erc20, owner, secondAccount } = await loadFixture(
        deployOneYearLockFixture
      );
    
      const provider = waffle.provider;
      const ownerAddress = owner.address;

      const otherAddress = secondAccount.address;

      console.log(await getBalance(erc20, owner.address));
      console.log(await getBalance(erc20, secondAccount.address));

      let amount = ethers.utils.parseUnits("100", "ether");
      expect(await getAllowance(erc20, ownerAddress, otherAddress)).to.be.eq(0);

      await expect(
        erc20
          .connect(secondAccount)
          .transferFrom(owner.address, secondAccount.address, amount)
      ).to.be.reverted;

      const result = await signERC2612Permit(
        provider,
        erc20.address,
        ownerAddress,
        otherAddress,
        amount.toString()
      );

      let tx = await erc20.connect(secondAccount).permit(
        ownerAddress,
        otherAddress,
        amount,
        result.deadline,
        result.v,
        result.r,
        result.s
      );
      await tx.wait();
      expect(await getAllowance(erc20, ownerAddress, otherAddress)).to.be.eq(100);

      expect(await getBalance(erc20, otherAddress)).to.be.eq(0);

      tx = await erc20
      .connect(secondAccount)
      .transferFrom(owner.address, secondAccount.address, amount);

      await tx.wait();

      expect(await getBalance(erc20, otherAddress)).to.be.eq(100);

    });

    // it("Should set the right owner", async function () {
    //   const { lock, owner } = await loadFixture(deployOneYearLockFixture);

    //   expect(await lock.owner()).to.equal(owner.address);
    // });

    // it("Should receive and store the funds to lock", async function () {
    //   const { lock, lockedAmount } = await loadFixture(
    //     deployOneYearLockFixture
    //   );

    //   expect(await ethers.provider.getBalance(lock.address)).to.equal(
    //     lockedAmount
    //   );
    // });

    // it("Should fail if the unlockTime is not in the future", async function () {
    //   // We don't use the fixture here because we want a different deployment
    //   const latestTime = await time.latest();
    //   const Lock = await ethers.getContractFactory("Lock");
    //   await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
    //     "Unlock time should be in the future"
    //   );
    // });
  });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw())
  //         .to.emit(lock, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).to.changeEtherBalances(
  //         [owner, lock],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  // });
});
