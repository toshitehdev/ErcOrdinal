const hre = require("hardhat");
const { assert } = require("chai");

describe("ErcOrdinal", function () {
  let ErcOrdinal, ercordinal;
  beforeEach(async function () {
    ErcOrdinal = await hre.ethers.getContractFactory("ErcOrdinal");
    ercordinal = await ErcOrdinal.deploy();
  });

  //initial length of ids, genesis mint
  it("Should start with length 10", async function () {
    const currentLength = await ercordinal.get_ids_length();
    const expectedLength = 10;
    assert.equal(currentLength, expectedLength);
  });
});
