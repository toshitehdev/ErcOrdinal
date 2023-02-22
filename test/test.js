const hre = require("hardhat");
const { assert, expect } = require("chai");

describe("ErcOrdinal", function () {
  let ErcOrdinal, ercordinal;
  beforeEach(async function () {
    ErcOrdinal = await hre.ethers.getContractFactory("ErcOrdinal");
    ercordinal = await ErcOrdinal.deploy();
  });

  it("Owner should be deployer", async function () {
    const [owner] = await hre.ethers.getSigners();
    const deployer = await ercordinal.the_creator();
    assert.equal(owner.address, deployer);
  });
  it("spender_allowance should have _amount > 0", async function () {
    const [owner] = await ethers.getSigners();
    const spender = "0xC5b2134120c50143438cA765E2bC67d605f709a3";
    const amountSent = 1;
    await ercordinal.approve(spender, amountSent);
    const _amount = await ercordinal.allowance(owner.address, spender);
    expect(_amount).to.be.gt(0);
  });
  it("Should revert if amount sent more than balance", async function () {
    const [, addr1, addr2] = await hre.ethers.getSigners();
    const amount = 1;
    await ercordinal.transfer(addr1.address, amount);
    await expect(
      ercordinal.connect(addr1).transfer(addr2.address, amount + 1)
    ).to.be.revertedWith("Not enough balance");
  });
  it("Should read correct balance of given address", async function () {
    const [, addr1] = await hre.ethers.getSigners();
    const amount = 1;
    const oldBalance = await ercordinal.balanceOf(addr1.address);
    await ercordinal.transfer(addr1.address, amount);
    const newBalance = await ercordinal.balanceOf(addr1.address);
    const expectedBalance =
      hre.ethers.BigNumber.from(oldBalance).toNumber() + amount;
    assert.equal(newBalance, expectedBalance);
  });
  it("Changed max_transfer value", async function () {
    const newMax = 20;
    await ercordinal.changeMaxTransfer(newMax);
    const expectedMaxTransfer = await ercordinal.max_transfer();
    assert.equal(newMax, expectedMaxTransfer);
  });
  it("Should add +1 id's length", async function () {
    const oldLength = await ercordinal.get_ids_length();
    await ercordinal.mint("somestring", "somestring", {
      value: hre.ethers.utils.parseEther("0.05"),
    });
    const newLength = await ercordinal.get_ids_length();
    const expectedLength = hre.ethers.BigNumber.from(oldLength).toNumber() + 1;
    assert.equal(newLength, expectedLength);
  });
});
