import { getContractAddresses, getSomnexConfig } from './networks';

export const SOMNIA_MAINNET_CHAIN_ID = 5031;
export const SOMNIA_TESTNET_CHAIN_ID = 50312;

export const SOMNIA_MAINNET_CONFIG = {
  chainId: SOMNIA_MAINNET_CHAIN_ID,
  name: 'Somnia',
  currency: 'SOMI',
  explorerUrl: 'https://explorer.somnia.network',
  rpcUrl: 'https://api.infra.mainnet.somnia.network/'
};

export const SOMNIA_TESTNET_CONFIG = {
  chainId: SOMNIA_TESTNET_CHAIN_ID,
  name: 'Somnia Testnet',
  currency: 'STT',
  explorerUrl: 'https://shannon-explorer.somnia.network/',
  rpcUrl: 'https://dream-rpc.somnia.network/'
};

const isTestnet = true;

export const CONTRACT_ADDRESSES = getContractAddresses(isTestnet);

console.log('Contract addresses loaded:', CONTRACT_ADDRESSES);
console.log('Using testnet:', isTestnet);

export const REGISTRY_ABI = [
  {
    "inputs": [],
    "name": "getTokenFactory",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBondingCurve",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLiquidityPool",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getUserManager",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getFeeManager",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMarketGraduation",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getWSTT",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "isValidToken",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export const TOKEN_FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "symbol", "type": "string"},
      {"internalType": "uint256", "name": "supply", "type": "uint256"},
      {"internalType": "string", "name": "imageUri", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"}
    ],
    "name": "createToken",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllTokens",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "tokenAddress", "type": "address"}],
    "name": "getTokenMetadata",
    "outputs": [
      {
        "components": [
          {"internalType": "string", "name": "name", "type": "string"},
          {"internalType": "string", "name": "symbol", "type": "string"},
          {"internalType": "string", "name": "imageUri", "type": "string"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "address", "name": "creator", "type": "address"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "uint256", "name": "totalSupply", "type": "uint256"},
          {"internalType": "bool", "name": "active", "type": "bool"}
        ],
        "internalType": "struct TokenFactory.TokenMetadata",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "token", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "symbol", "type": "string"}
    ],
    "name": "TokenCreated",
    "type": "event"
  }
];

export const BONDING_CURVE_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "uint256", "name": "sttAmount", "type": "uint256"}
    ],
    "name": "buyTokens",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "uint256", "name": "tokenAmount", "type": "uint256"}
    ],
    "name": "sellTokens",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "getPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "getCurveInfo",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "soldSupply", "type": "uint256"},
          {"internalType": "uint256", "name": "sttCollected", "type": "uint256"},
          {"internalType": "uint256", "name": "virtualSttReserves", "type": "uint256"},
          {"internalType": "uint256", "name": "virtualTokenReserves", "type": "uint256"},
          {"internalType": "bool", "name": "graduated", "type": "bool"},
          {"internalType": "bool", "name": "active", "type": "bool"}
        ],
        "internalType": "struct BondingCurveContract.TokenCurve",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "initializeCurve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "getTokenBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "token", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "buyer", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "sttIn", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "tokensOut", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "newPrice", "type": "uint256"}
    ],
    "name": "TokenBought",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "token", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "seller", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "tokensIn", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "sttOut", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "newPrice", "type": "uint256"}
    ],
    "name": "TokenSold",
    "type": "event"
  }
];

export const MARKET_GRADUATION_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "checkGraduation",
    "outputs": [
      {"internalType": "bool", "name": "canGraduate", "type": "bool"},
      {"internalType": "uint256", "name": "sttCollected", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "graduateToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "listOnDEX",
    "outputs": [{"internalType": "address", "name": "poolAddress", "type": "address"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "isGraduated",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "getPoolAddress",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "token", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "pool", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "sttLocked", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "tokensLocked", "type": "uint256"}
    ],
    "name": "TokenGraduated",
    "type": "event"
  }
];

export const USER_MANAGEMENT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "validateAccess",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "canCreateToken",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export const FEE_MANAGER_ABI = [
  {
    "inputs": [],
    "name": "claimRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getPendingRewards",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export const WSTT_ABI = [
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export const MEME_TOKEN_ABI = [
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenImageUri",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "description",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];