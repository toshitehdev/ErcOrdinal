require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */

const GEORLI_RPC_URL = process.env.GEORLI_RPC_URL;
const PRIV_KEY = process.env.PRIV_KEY;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: GEORLI_RPC_URL,
      accounts: [PRIV_KEY],
      chainId: 5,
    },
  },
  solidity: "0.8.8",
};
