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
    const [owner, addr1] = await ethers.getSigners();
    const amountSent = 1;
    await ercordinal.approve(addr1.address, amountSent);
    const _amount = await ercordinal.allowance(owner.address, addr1.address);
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

  it("Should revert if amount sent more than max_transfer", async function () {
    const [, addr1] = await hre.ethers.getSigners();
    const max_transfer = await ercordinal.max_transfer();
    //max_transfer is maximum transfer allowed + 1
    //see contract function transferBulk
    await expect(
      ercordinal.transfer(addr1.address, max_transfer)
    ).to.be.revertedWith("Reached max transfer cap");
  });

  it("Should revert if spender transfer more than amount", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const amount = 10;
    await ercordinal.approve(addr1.address, amount);
    await expect(
      ercordinal
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, amount + 1)
    ).to.be.revertedWith("Not enough allowance");
  });

  it("Should reduct spender allowance after transferFrom", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const amount = 10;
    await ercordinal.approve(addr1.address, amount);
    const oldAllowance = await ercordinal.allowance(
      owner.address,
      addr1.address
    );
    await ercordinal
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, amount - 5);
    const allowance = await ercordinal.allowance(owner.address, addr1.address);
    const expectedAllowance =
      hre.ethers.BigNumber.from(oldAllowance).toNumber() - 5;
    assert.equal(
      hre.ethers.BigNumber.from(allowance).toNumber(),
      expectedAllowance
    );
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

  it("Should add +1 id's length given correct mint price", async function () {
    const oldLength = await ercordinal.get_ids_length();
    await ercordinal.mint("somestring", "somestring", {
      value: hre.ethers.utils.parseEther("0.05"),
    });
    const newLength = await ercordinal.get_ids_length();
    const expectedLength = hre.ethers.BigNumber.from(oldLength).toNumber() + 1;
    assert.equal(newLength, expectedLength);
  });

  it("Should revert if ETH send < mint price", async function () {
    await expect(
      ercordinal.mint("somestring", "somestring", {
        value: hre.ethers.utils.parseEther("0.03"),
      })
    ).to.be.reverted;
  });

  it("Should revert if sender is not the token owner", async function () {
    const [, addr1, addr2] = await hre.ethers.getSigners();
    await expect(
      ercordinal.connect(addr1).transferSingle(addr2.address, 1)
    ).to.be.revertedWith("Must be the owner");
    assert.equal(1, 1);
  });

  it("Should add id length of new owner", async function () {
    const [, addr1] = await hre.ethers.getSigners();
    const oldLength = await ercordinal.getAddressToIds(addr1.address);
    await ercordinal.transferSingle(addr1.address, 5);
    const newLength = await ercordinal.getAddressToIds(addr1.address);
    assert.equal(newLength.length, oldLength.length + 1);
  });

  it("Should add token index key to recipient", async function () {
    const [, addr1] = await hre.ethers.getSigners();
    await ercordinal.transferSingle(addr1.address, 5);
    await ercordinal.transferSingle(addr1.address, 7);
    await ercordinal.transferSingle(addr1.address, 8);
    const newIndex = await ercordinal.getIdToIndex(addr1.address, 7);
    assert.equal(newIndex.index, 2);
  });

  it("Should remove token index key from owner", async function () {
    const [, addr1, addr2] = await hre.ethers.getSigners();
    await ercordinal.transferSingle(addr1.address, 7);
    await ercordinal.transferSingle(addr1.address, 5);
    await ercordinal.transferSingle(addr1.address, 8);
    await ercordinal.connect(addr1).transferSingle(addr2.address, 8);
    const newIndex = await ercordinal.getIdToIndex(addr1.address, 8);
    assert.equal(newIndex.index, 0);
  });

  it("Should add token id to recipient array", async function () {
    const [, addr1, addr2] = await hre.ethers.getSigners();
    await ercordinal.transferSingle(addr1.address, 7);
    await ercordinal.transferSingle(addr1.address, 5);
    await ercordinal.transferSingle(addr1.address, 8);
    const newArray = await ercordinal.getAddressToIds(addr1.address);
    assert.equal(newArray[0], 7);
  });

  it("Should change token id position and remove", async function () {
    const [, addr1, addr2] = await hre.ethers.getSigners();
    await ercordinal.transferSingle(addr1.address, 7);
    await ercordinal.transferSingle(addr1.address, 5);
    await ercordinal.transferSingle(addr1.address, 8);
    await ercordinal.connect(addr1).transferSingle(addr2.address, 7);
    const newArray = await ercordinal.getAddressToIds(addr1.address);
    assert.equal(newArray[0], 8);
  });

  it("Should change token owner", async function () {
    const [, addr1] = await hre.ethers.getSigners();
    await ercordinal.transferSingle(addr1.address, 7);
    const token = await ercordinal.idToTokens(7);
    assert.equal(token.owner, addr1.address);
  });
});
