const hre = require("hardhat");

const { assert, expect } = require("chai");
const { ABI } = require("../uniABI");

function makeNumber(bignum) {
  return hre.ethers.BigNumber.from(bignum).toNumber();
}

describe("ErcOrdinal", function () {
  let ErcOrdinal, ercordinal;
  beforeEach(async function () {
    ErcOrdinal = await hre.ethers.getContractFactory("ErcOrdinal");
    const [, addr1, addr2] = await hre.ethers.getSigners();
    //constructor params, address 1 and 2 being dev1 and dev2
    //BASE_URI is the base address for nft metadata on IPFS
    ercordinal = await ErcOrdinal.deploy(
      addr1.address,
      addr2.address,
      "BASE_URI"
    );
  });
  it("Set erc721 address and transfer to that address from specified address", async () => {
    const [, erc721Contract, addr2] = await hre.ethers.getSigners();
    const oldLength = await ercordinal.getAddressToIds(addr2.address);
    await ercordinal.setErc721Address(erc721Contract.address);
    await ercordinal.connect(erc721Contract).erc721Switch(addr2.address, 7);
    const tokenOwner = await ercordinal.getIdToTokens(7);
    const newLength = await ercordinal.getAddressToIds(addr2.address);
    assert.equal(newLength.length, oldLength.length - 1);
    assert.equal(tokenOwner, erc721Contract.address);
  });
  it("Revert if not erc721 specified address call the function", async () => {
    const [owner, erc721Contract, addr2, addr3] = await hre.ethers.getSigners();
    await ercordinal.setErc721Address(erc721Contract.address);
    await expect(
      ercordinal.connect(addr3).erc721Switch(addr2.address, 7)
    ).to.be.revertedWith("Only ErcOrdinal ERC721 address can call");
  });
  it("Revert if not the token owner", async () => {
    const [owner, erc721Contract, addr2] = await hre.ethers.getSigners();
    await ercordinal.setErc721Address(erc721Contract.address);
    await expect(
      ercordinal.connect(erc721Contract).erc721Switch(owner.address, 7)
    ).to.be.revertedWith("Address from is not the owner");
  });
  //================== GENESIS/DEPLOY =================================//
  it("Assign token_creator to deployer", async () => {
    const [owner] = await hre.ethers.getSigners();
    const the_creator = await ercordinal.the_creator();
    assert.equal(owner.address, the_creator);
  });
  it("Token counter should be genesis supply - 1", async () => {
    const token_counter = await ercordinal.token_counter();
    const genesis_supply = await ercordinal.getGenesisSupply();
    assert.equal(makeNumber(token_counter), makeNumber(genesis_supply));
  });
  it("Transfer id #0 to deployer", async () => {
    const [owner] = await hre.ethers.getSigners();
    const dev1_token = await ercordinal.getAddressToIds(owner.address);
    assert.equal(dev1_token[0], 0);
  });
  it("Transfer 100 token to deployer", async () => {
    const [owner] = await hre.ethers.getSigners();
    const dev1_token = await ercordinal.getAddressToIds(owner.address);
    assert.equal(dev1_token.length, 101);
  });
  it("Token index for deployer should correct", async () => {
    const [owner] = await hre.ethers.getSigners();
    const deployer_token = await ercordinal.getAddressToIds(owner.address);
    for (let i = 0; i < deployer_token.length; i++) {
      const deployer_token_index = await ercordinal.getIdToIndex(
        owner.address,
        deployer_token[i]
      );
      assert.equal(deployer_token_index.index, i + 1);
    }
  });
  it("Transfer tokens to dev1 and dev2, 5 tokens each", async () => {
    const [, addr1, addr2] = await hre.ethers.getSigners();
    const dev1_token = await ercordinal.getAddressToIds(addr1.address);
    const dev2_token = await ercordinal.getAddressToIds(addr2.address);
    assert.equal(dev1_token.length, 5);
    assert.equal(dev2_token.length, 5);
  });
  it("Tokens for dev1 is id 1-5", async () => {
    const [, addr1] = await hre.ethers.getSigners();
    const dev1_token = await ercordinal.getAddressToIds(addr1.address);
    for (let i = 0; i < 5; i++) {
      assert.equal(dev1_token[i], i + 1);
    }
  });
  it("Token index for dev1 should correct", async () => {
    const [, addr1] = await hre.ethers.getSigners();
    const dev_token = await ercordinal.getAddressToIds(addr1.address);
    for (let i = 0; i < dev_token.length; i++) {
      const dev_token_index = await ercordinal.getIdToIndex(
        addr1.address,
        dev_token[i]
      );
      assert.equal(dev_token_index.index, i + 1);
    }
  });
  it("Tokens for dev2 is id 6-10", async () => {
    const [, , addr2] = await hre.ethers.getSigners();
    const dev1_token = await ercordinal.getAddressToIds(addr2.address);
    for (let i = 0; i < 5; i++) {
      assert.equal(dev1_token[i], i + 6);
    }
  });
  it("Token index for dev2 should correct", async () => {
    const [, , addr2] = await hre.ethers.getSigners();
    const dev_token = await ercordinal.getAddressToIds(addr2.address);
    for (let i = 0; i < dev_token.length; i++) {
      const dev_token_index = await ercordinal.getIdToIndex(
        addr2.address,
        dev_token[i]
      );
      assert.equal(dev_token_index.index, i + 1);
    }
  });
  it("Id 1-10 should be eligible for 10 free mint each", async () => {
    for (let i = 1; i < 11; i++) {
      const idToEligibleForBounty = await ercordinal.idToEligibleForBounty([i]);
      assert.equal(idToEligibleForBounty.is_eligible, true);
      assert.equal(idToEligibleForBounty.prize_amount, 10);
    }
  });
  //================== GENESIS/DEPLOY =================================//

  //================== ERC20 Standard getter ===========================//
  it("Able to get token name", async () => {
    const name = await ercordinal.name();
    assert.equal(name, "ErcOrdinal");
  });
  it("Able to get token symbol", async () => {
    const symbol = await ercordinal.symbol();
    assert.equal(symbol, "ERCORD");
  });
  it("Able to get supply", async () => {
    const supply = await ercordinal.totalSupply();
    assert.equal(supply, 100000);
  });
  it("Able to get token decimal", async () => {
    const decimals = await ercordinal.decimals();
    assert.equal(decimals, 0);
  });
  it("Able to get correct balance", async () => {
    const [, , addr2] = await hre.ethers.getSigners();
    const balanceOf = await ercordinal.balanceOf(addr2.address);
    assert.equal(balanceOf, 5);
  });
  //================== ERC20 Standard getter ============================//

  //================== Transfer ============================//
  it("Should revert when self tx", async function () {
    const [owner] = await hre.ethers.getSigners();
    await expect(ercordinal.transfer(owner.address, 4)).to.be.revertedWith(
      "Self transfer not allowed"
    );
  });

  it("Should transfer-receive = tail-head, case: recipent dont hold any", async function () {
    const [, addr1, addr2] = await hre.ethers.getSigners();
    const startingSender = await ercordinal.getAddressToIds(addr1.address);

    await ercordinal.connect(addr1).transfer(addr2.address, 3);

    const endingRecipient = await ercordinal.getAddressToIds(addr2.address);

    assert.equal(
      hre.ethers.BigNumber.from(startingSender[4]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[0]).toNumber()
    );
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[3]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[1]).toNumber()
    );
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[2]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[2]).toNumber()
    );
  });

  it("Should transfer-receive = tail-head, recipent hold already", async function () {
    const [, addr1, , addr3] = await hre.ethers.getSigners();
    const startingSender = await ercordinal.getAddressToIds(addr1.address);
    await ercordinal.connect(addr1).transfer(addr3.address, 2);
    await ercordinal.connect(addr1).transfer(addr3.address, 3);
    const endingRecipient = await ercordinal.getAddressToIds(addr3.address);
    //first two is a push, add to the tail
    //because holder dont hold any
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[4]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[4]).toNumber()
    );
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[3]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[3]).toNumber()
    );
    //next transfer is insert to head
    //because holder already hold tokens
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[2]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[0]).toNumber()
    );
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[1]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[1]).toNumber()
    );
    assert.equal(
      hre.ethers.BigNumber.from(startingSender[0]).toNumber(),
      hre.ethers.BigNumber.from(endingRecipient[2]).toNumber()
    );
  });

  it("Approve, spender_allowance should be the same as allowance", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const allowance = 1;
    await ercordinal.approve(addr1.address, allowance);
    const _amount = await ercordinal.allowance(owner.address, addr1.address);
    assert.equal(_amount, allowance);
  });

  it("Should revert if amount sent more than balance", async function () {
    const [, addr1, addr2] = await hre.ethers.getSigners();
    const balanceOf = await ercordinal.balanceOf(addr1.address);
    await expect(
      ercordinal.connect(addr1).transfer(addr2.address, balanceOf + 1)
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
    await ercordinal.connect(addr1).approve(addr2.address, amount);
    const oldAllowance = await ercordinal.allowance(
      addr1.address,
      addr2.address
    );
    await ercordinal
      .connect(addr2)
      .transferFrom(addr1.address, owner.address, amount - 5);
    const allowance = await ercordinal.allowance(addr1.address, addr2.address);
    const expectedAllowance =
      hre.ethers.BigNumber.from(oldAllowance).toNumber() - 5;
    assert.equal(
      hre.ethers.BigNumber.from(allowance).toNumber(),
      expectedAllowance
    );
  });

  // it("Should revert if sender is not the token owner", async function () {
  //   const [, addr1, addr2] = await hre.ethers.getSigners();
  //   //addr1 try to send id#1 to addr2, while he's not the owner
  //   await expect(
  //     ercordinal.connect(addr1).transferSingle(addr2.address, 0)
  //   ).to.be.revertedWith("Must be the owner");
  // });

  // it("Should add id length of new owner", async function () {
  //   const [owner, addr1] = await hre.ethers.getSigners();
  //   const oldLength = await ercordinal.getAddressToIds(owner.address);
  //   await ercordinal.connect(addr1).transferSingle(owner.address, 5);
  //   const newLength = await ercordinal.getAddressToIds(owner.address);
  //   assert.equal(newLength.length, oldLength.length + 1);
  // });

  // it("Should add token index key to recipient", async function () {
  //   const [owner, addr1] = await hre.ethers.getSigners();
  //   await ercordinal.connect(addr1).transferSingle(owner.address, 2);
  //   const newIndex = await ercordinal.getIdToIndex(owner.address, 2);
  //   assert.equal(newIndex.index, 102);
  // });

  // it("Should remove token index key from owner", async function () {
  //   const [owner, addr1, addr2] = await hre.ethers.getSigners();
  //   await ercordinal.connect(addr1).transferSingle(owner.address, 2);
  //   await ercordinal.connect(addr1).transferSingle(owner.address, 3);
  //   await ercordinal.connect(addr1).transferSingle(owner.address, 4);

  //   await ercordinal.transferSingle(addr2.address, 4);
  //   const newIndex = await ercordinal.getIdToIndex(owner.address, 4);
  //   assert.equal(newIndex.index, 0);
  // });

  it("Should transfer correct ids", async function () {
    const [owner, addr1] = await hre.ethers.getSigners();
    await ercordinal.connect(addr1).transferMany(owner.address, [2, 3, 4]);
    for (let i = 0; i < 3; i++) {
      const token_owner = await ercordinal.getIdToTokens(i + 2);
      assert.equal(token_owner, owner.address);
    }
  });
  //================== Transfer ============================//

  //================== Mint ============================//
  it("Should mint many tokens", async function () {
    const [, addr1] = await hre.ethers.getSigners();
    const startRecipient = await ercordinal.getAddressToIds(addr1.address);
    await ercordinal.connect(addr1).mintMany(5, {
      value: hre.ethers.utils.parseEther("0.1"),
    });
    const endingRecipient = await ercordinal.getAddressToIds(addr1.address);
    assert.equal(endingRecipient.length, startRecipient.length + 5);
  });

  it("Mint price should be up, revert when not met", async function () {
    await ercordinal.mintMany(100, {
      value: hre.ethers.utils.parseEther("1"),
    });
    await ercordinal.mintMany(100, {
      value: hre.ethers.utils.parseEther("1"),
    });
    await ercordinal.mintMany(100, {
      value: hre.ethers.utils.parseEther("1"),
    });
    await expect(
      ercordinal.mintMany(100, { value: hre.ethers.utils.parseEther("1") })
    ).to.be.revertedWith("Hit price change point");
  });
  //================== Mint ============================//

  //=================== Bounty ==========================================
  it("Should add free_mint_alloc", async function () {
    const prize_amount = 10;
    const old_free_alloc = await ercordinal.free_mint_allocation();
    await ercordinal.setEligibleIds([115, 120, 125], prize_amount);
    const new_free_alloc = await ercordinal.free_mint_allocation();
    assert.equal(
      makeNumber(old_free_alloc) + prize_amount * 3,
      makeNumber(new_free_alloc)
    );
  });
  it("Claim bounty one", async function () {
    const [, , addr2] = await hre.ethers.getSigners();
    await ercordinal.setEligibleIds([115], 1);
    await ercordinal
      .connect(addr2)
      .mintMany(10, { value: hre.ethers.utils.parseEther("0.1") });
    await ercordinal.connect(addr2).claimBounty(115);
    const endingBalance = await ercordinal.getAddressToIds(addr2.address);
    const token_counter = await ercordinal.token_counter();
    assert.equal(endingBalance.length, 16);
    assert.equal(token_counter, 122);
  });
  it("Decrease free_mint", async function () {
    const [, , addr2] = await hre.ethers.getSigners();
    await ercordinal.setEligibleIds([115], 1);
    const old_free_alloc = await ercordinal.free_mint_allocation();
    await ercordinal
      .connect(addr2)
      .mintMany(10, { value: hre.ethers.utils.parseEther("0.1") });
    await ercordinal.connect(addr2).claimBounty(115);
    const new_free_alloc = await ercordinal.free_mint_allocation();
    assert.equal(new_free_alloc, makeNumber(old_free_alloc) - 1);
  });
  it("Add unclaimed_bounty amount", async function () {
    const [, , addr2] = await hre.ethers.getSigners();
    await ercordinal.setEligibleIds([115, 123], 10);
    await ercordinal
      .connect(addr2)
      .mintMany(10, { value: hre.ethers.utils.parseEther("0.1") });
    await ercordinal.connect(addr2).claimBounty(115);
    const unclaimed_bounty = await ercordinal.expired_bounty();
    assert.equal(unclaimed_bounty, 10);
  });

  //=================== Bounty ==========================================

  it("Should withdraw", async function () {
    const [, addr1] = await hre.ethers.getSigners();
    await ercordinal.connect(addr1).mintMany(1, {
      value: hre.ethers.utils.parseEther("0.01"),
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

//==========================================================================

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
