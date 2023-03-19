require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");

/** @type import('hardhat/config').HardhatUserConfig */

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const PRIV_KEY = process.env.PRIV_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const CMC_API_KEY = process.env.CMC_API_KEY;
const LOCAL_NODE_KEY = process.env.LOCAL_NODE_KEY;
const REMOTE_NODE_KEY = process.env.REMOTE_NODE_KEY;
const MAINNET_KEY = process.env.MAINNET_KEY;
const REMOTENODE_RPC = process.env.REMOTENODE_RPC;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${MAINNET_KEY}`,
        blockNumber: 16731423,
      },
    },
    // goerli: {
    //   url: GOERLI_RPC_URL,
    //   accounts: [PRIV_KEY],
    //   chainId: 5,
    // },
    localnode: {
      url: "http://127.0.0.1:8545/",
      accounts: [LOCAL_NODE_KEY],
      chainid: 31337,
    },
    remotenode: {
      url: REMOTENODE_RPC,
      accounts: [REMOTE_NODE_KEY],
      chainid: 1337,
    },
  },
  solidity: "0.8.8",
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    coinmarketcap: CMC_API_KEY,
    token: "ETH",
  },
};
