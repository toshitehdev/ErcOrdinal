const hre = require("hardhat");

async function main() {
  const ErcOrdinal = await hre.ethers.getContractFactory("ErcOrdinal");
  const ercordinal = await ErcOrdinal.deploy();

  await ercordinal.deployed();
  console.log(`Deployed to: ${ercordinal.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
