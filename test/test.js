const hre = require("hardhat");

const { assert, expect } = require("chai");
const { ABI } = require("../uniABI");

describe("ErcOrdinal", function () {
  let ErcOrdinal, ercordinal;
  beforeEach(async function () {
    ErcOrdinal = await hre.ethers.getContractFactory("ErcOrdinal");
    ercordinal = await ErcOrdinal.deploy();
  });

  // =================== Uniswap Testing, kinda unique case contract ===============
  // Should really be done on testnet
  // Uniswap UI might do some weird price calculation stuff
  // anyway, can still test simple usecase

  // it("Test addliq", async function () {
  //   const [owner] = await hre.ethers.getSigners();
  //   const router = new ethers.Contract(
  //     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  //     ABI,
  //     owner
  //   );

  //   await ercordinal.approve(
  //     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  //     1000
  //   );
  //   const date = new Date();
  //   const deadline = date.getTime() + 2000;
  //   const addLiq = await router.addLiquidityETH(
  //     ercordinal.address,
  //     100,
  //     99,
  //     2,
  //     owner.address,
  //     deadline,
  //     {
  //       value: hre.ethers.utils.parseEther("2"),
  //     }
  //   );
  //   // console.log(addLiq);
  //   assert.equal(1, 1);
  // });

  // it("Buy: User type ETH first when buying", async function () {
  //   const [owner, addr1] = await hre.ethers.getSigners();
  //   const router = new ethers.Contract(
  //     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  //     ABI,
  //     owner
  //   );

  //   await ercordinal.approve(
  //     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  //     1000
  //   );
  //   const date = new Date();
  //   const deadline = date.getTime() + 2000;
  //   await router.addLiquidityETH(
  //     ercordinal.address,
  //     100,
  //     100,
  //     2,
  //     owner.address,
  //     deadline,
  //     {
  //       value: hre.ethers.utils.parseEther("2"),
  //     }
  //   );
  //   const deadline2 = date.getTime() + 2000;
  //   const sell = await router.swapExactTokensForETH(
  //     2,
  //     hre.ethers.utils.parseEther("0.038"),
  //     [ercordinal.address, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
  //     addr1.address,
  //     deadline2
  //   );
  //   await sell.wait(1);
  //   const endingBalance = await ercordinal.provider.getBalance(addr1.address);
  //   const endOwner = await ercordinal.getAddressToIds(owner.address);

  //   console.log(endOwner.length);
  //   assert.equal(1, 1);
  // });

  // ===================================== Uniswap Testing ===============

  it("Owner should be msg.sender", async function () {
    const [owner] = await hre.ethers.getSigners();
    const creator = await ercordinal.the_creator();
    assert.equal(owner.address, creator);
  });

  it("Token counter should be same as genesis supply", async function () {
    const genesis_supply = await ercordinal.getGenesisSupply();
    const token_counter = await ercordinal.token_counter();
    assert.equal(
      hre.ethers.BigNumber.from(genesis_supply).toNumber(),
      hre.ethers.BigNumber.from(token_counter).toNumber()
    );
  });

  it("Deployer should own genesis_supply", async function () {
    const [owner] = await hre.ethers.getSigners();
    const genesis_supply = await ercordinal.getGenesisSupply();
    const address_to_ids = await ercordinal.getAddressToIds(owner.address);
    assert.equal(
      hre.ethers.BigNumber.from(genesis_supply).toNumber(),
      address_to_ids.length
    );
  });

  it("All idToTokens genesis owner is creator", async function () {
    const [owner] = await hre.ethers.getSigners();
    const genesis_supply = await ercordinal.getGenesisSupply();
    const genesis_supply_number =
      hre.ethers.BigNumber.from(genesis_supply).toNumber();
    for (let i = 0; i < genesis_supply_number; i++) {
      let idToTokens = await ercordinal.idToTokens(i);
      assert.equal(owner.address, idToTokens.owner);
    }
  });

  it("test mint", async function () {
    const [owner] = await hre.ethers.getSigners();
    await ercordinal.mintMany(3, { value: hre.ethers.utils.parseEther("1") });
    await ercordinal.mintMany(2, { value: hre.ethers.utils.parseEther("1") });
    await ercordinal.mint({ value: hre.ethers.utils.parseEther("1") });
    await ercordinal.mintMany(1, { value: hre.ethers.utils.parseEther("1") });
    await ercordinal.mintMany(3, { value: hre.ethers.utils.parseEther("1") });
    await ercordinal.mintMany(1, { value: hre.ethers.utils.parseEther("1") });

    const endingBalance = await ercordinal.getAddressToIds(owner.address);
    // console.log(endingBalance);
    assert.equal(1, 1);
  });

  it("Should revert when self tx", async function () {
    const [owner] = await hre.ethers.getSigners();
    await expect(ercordinal.transfer(owner.address, 4)).to.be.reverted;
  });

  it("Should transfer-receive = tail-head, case: recipent dont hold any", async function () {
    const [owner, addr1] = await hre.ethers.getSigners();
    const startingSender = await ercordinal.getAddressToIds(owner.address);

    await ercordinal.transfer(addr1.address, 5);

    const endingRecipient = await ercordinal.getAddressToIds(addr1.address);

    assert.equal(
      hre.ethers.BigNumber.from(startingSender[149]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[0]).toNumber()
    );
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[148]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[1]).toNumber()
    );
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[147]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[2]).toNumber()
    );
  });

  it("Should transfer-receive = tail-head, recipent hold already", async function () {
    const [owner, addr1] = await hre.ethers.getSigners();
    const startingSender = await ercordinal.getAddressToIds(owner.address);
    await ercordinal.transfer(addr1.address, 2);
    await ercordinal.transfer(addr1.address, 3);
    const endingRecipient = await ercordinal.getAddressToIds(addr1.address);
    //first two is a push, add to the tail
    //because holder dont hold any
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[149]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[4]).toNumber()
    );
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[148]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[3]).toNumber()
    );
    //next transfer is insert to head
    //because holder already hold tokens
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[147]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[0]).toNumber()
    );
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[146]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[1]).toNumber()
    );
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[145]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[2]).toNumber()
    );
  });

  it("Approve, spender_allowance should have _amount > 0", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const allowance = 1;
    await ercordinal.approve(addr1.address, allowance);
    const _amount = await ercordinal.allowance(owner.address, addr1.address);
    expect(_amount).to.be.gt(0);
  });

  it("Should revert if amount sent more than balance", async function () {
    const [, addr1, addr2] = await hre.ethers.getSigners();
    const amount = 3;
    await ercordinal.transfer(addr1.address, amount);
    //try send amount +1 = 4, while addr1 balance is 3
    await expect(
      ercordinal.connect(addr1).transfer(addr2.address, amount + 1)
    ).to.be.revertedWith("Not enough balance");
  });

  it("Should revert if spender transfer more than allowance", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const amount = 10;
    //owner approved addr1 for 10 allowance
    await ercordinal.approve(addr1.address, amount);
    //address1 try to transfer amount+1 to address2
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

  it("Should add +1 to token_counter given correct mint price", async function () {
    const oldLength = await ercordinal.token_counter();
    await ercordinal.mint({
      value: hre.ethers.utils.parseEther("0.02"),
    });
    const newLength = await ercordinal.token_counter();
    const expectedLength = hre.ethers.BigNumber.from(oldLength).toNumber() + 1;
    assert.equal(newLength, expectedLength);
  });

  it("Should revert if ETH send < mint price", async function () {
    await expect(
      ercordinal.mint({
        value: hre.ethers.utils.parseEther("0.019"),
      })
    ).to.be.revertedWith("Not enough ETH");
  });

  it("Should revert if sender is not the token owner", async function () {
    const [, addr1, addr2] = await hre.ethers.getSigners();
    //addr1 try to send id#1 to addr2, while he's not the owner
    await expect(
      ercordinal.connect(addr1).transferSingle(addr2.address, 1)
    ).to.be.revertedWith("Must be the owner");
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
    const newIndex = await ercordinal.getIdToIndex(addr1.address, 5);
    assert.equal(newIndex.index, 1);
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
    const [, addr1] = await hre.ethers.getSigners();
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

  it("Should transfer correct ids", async function () {
    const [owner, addr1] = await hre.ethers.getSigners();
    const startRecipient = await ercordinal.getAddressToIds(addr1.address);
    const startSender = await ercordinal.getAddressToIds(owner.address);
    await ercordinal.transferMany(addr1.address, [0, 8, 3]);
    await ercordinal.transferMany(addr1.address, [4, 2, 1]);

    const endingRecipient = await ercordinal.getAddressToIds(addr1.address);
    const endingSender = await ercordinal.getAddressToIds(owner.address);

    assert.equal(endingRecipient.length, startRecipient.length + 6);
    assert.equal(endingSender.length, startSender.length - 6);
  });

  it("Should mint many tokens", async function () {
    const [, addr1] = await hre.ethers.getSigners();
    const startRecipient = await ercordinal.getAddressToIds(addr1.address);
    await ercordinal.connect(addr1).mintMany(5, {
      value: hre.ethers.utils.parseEther("0.1"),
    });
    const endingRecipient = await ercordinal.getAddressToIds(addr1.address);
    assert.equal(endingRecipient.length, startRecipient.length + 5);
  });

  it("Should withdraw", async function () {
    const [, addr1] = await hre.ethers.getSigners();
    await ercordinal.connect(addr1).mint({
      value: hre.ethers.utils.parseEther("0.05"),
    });
    const [owner] = await hre.ethers.getSigners();
    const startingContractBalance = await ercordinal.provider.getBalance(
      ercordinal.address
    );

    const startingOwnerBalance = await ercordinal.provider.getBalance(
      owner.address
    );

    const tx = await ercordinal.withdrawMintSale();
    const receipt = await tx.wait(1);

    const { gasUsed, effectiveGasPrice } = receipt;

    const gasCost = gasUsed.mul(effectiveGasPrice);

    const endingContractBalance = await ercordinal.provider.getBalance(
      ercordinal.address
    );
    const endingOwnerBalance = await ercordinal.provider.getBalance(
      owner.address
    );

    assert.equal(endingContractBalance, 0);
    assert.equal(
      startingContractBalance.add(startingOwnerBalance).toString(),
      endingOwnerBalance.add(gasCost).toString()
    );
  });
});
