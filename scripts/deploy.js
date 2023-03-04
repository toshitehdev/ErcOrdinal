const hre = require("hardhat");

async function main() {
  const ErcOrdinal = await hre.ethers.getContractFactory("ErcOrdinal");
  const ercordinal = await ErcOrdinal.deploy(
    "0x1e9eF3D5931AE575B97BCb24d8ffB8aE06533583",
    "BASE_URI"
  );

  await ercordinal.deployed();
  console.log(`Deployed to: ${ercordinal.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
