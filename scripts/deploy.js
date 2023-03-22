const hre = require("hardhat");

async function main() {
  const localDevAddresses = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  ];
  const remoteDevAddresses = [
    "0x1e9eF3D5931AE575B97BCb24d8ffB8aE06533583",
    "0x1944EA4c79718F149f5F1d0193c7561F149ac8ac",
  ];
  const testnetDevAddresses = [
    "0x348bbCF00286870958b69e757526b8bDD4438789",
    "0x4e32585da8366B1293aD0F9671E781fF98046D54",
  ];
  const mainnetDevAddresses = [
    "0x348bbCF00286870958b69e757526b8bDD4438789",
    "0x4e32585da8366B1293aD0F9671E781fF98046D54",
  ];

  const env = "testnet";
  function addressToUse() {
    if (env === "local") {
      return localDevAddresses;
    }
    if (env === "remote") {
      return remoteDevAddresses;
    }
    if (env === "testnet") {
      return testnetDevAddresses;
    }
    if (env === "mainnet") {
      return mainnetDevAddresses;
    }
  }
  const ErcOrdinal = await hre.ethers.getContractFactory("ErcOrdinal");
  const ercordinal = await ErcOrdinal.deploy(
    addressToUse()[0],
    addressToUse()[1],
    "bafybeibqknpxt2dc2s3o5ulfsvqognymzzaot2xk6hkwonhq3qmyerljfe"
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
