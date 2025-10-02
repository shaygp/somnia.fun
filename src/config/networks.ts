import { Chain } from 'wagmi';

export const somniaMainnet: Chain = {
  id: 5031,
  name: 'Somnia',
  nativeCurrency: {
    decimals: 18,
    name: 'SOMI',
    symbol: 'SOMI',
  },
  rpcUrls: {
    default: {
      http: ['https://api.infra.mainnet.somnia.network/'],
    },
    public: {
      http: ['https://api.infra.mainnet.somnia.network/'],
    },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://explorer.somnia.network' },
  },
  testnet: false,
};

export const somniaTestnet: Chain = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'SOMI',
    symbol: 'SOMI',
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network/'],
    },
    public: {
      http: ['https://dream-rpc.somnia.network/'],
    },
  },
  blockExplorers: {
    default: { name: 'Somnia Shannon Explorer', url: 'https://shannon-explorer.somnia.network/' },
  },
  testnet: true,
};

export const CONTRACT_ADDRESSES = {
  mainnet: {
    REGISTRY: '0x3bb0d2796562a96Be23020EC750d8a1a021B9fDe',
    TOKEN_FACTORY: '0xeeC988BB024C876112c56E96E82dB87fc18e8116',
    BONDING_CURVE: '0x4650141E4276bB3AB54d81A7dc3EC86DfFfBD45B',
    LIQUIDITY_POOL: '0xDC225E7d4e3a1e5A65aC39F4B60E85f7657FFf0C',
    USER_MANAGER: '0x7231bB2Ebc50cB32731cf7303E077B0042ab6778',
    FEE_MANAGER: '0xa54BcA9BC27A77037D709248aB4F8f23b3f5bc5c',
    MARKET_GRADUATION: '0x9e34699767454d90f6315394c7F0d5E00e9Ad376',
    WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
    SOMNEX_INTEGRATION: '0x9bd31aA76589D0408fD644cbE1A4bE73e3c9e3F7',
    SOMNEX_FACTORY: '0x46C6FBD364325aE500d1A5a3A7A32B34ec5c5e73',
    SOMNEX_ROUTER: '0x28783c7Af9bCF35cA9b5417077daBcB274D64537',
  },
  testnet: {
    REGISTRY: '0x5ED23A5b8f76E202De46a608a66e6FE25060f4A6',
    TOKEN_FACTORY: '0x1A42907c51923D98EF39A25C28ffCe06dbA90517',
    BONDING_CURVE: '0x02017137623069af9D1De88A20e4c589c781F9ae',
    LIQUIDITY_POOL: '0xc805b0eF722B850b19923172b0CDCA705e0e7f6f',
    USER_MANAGER: '0x7a16afFcE6d068192da5A3D92cB99654cBAA1075',
    FEE_MANAGER: '0x6Ee33E77667e9984131E59f96CE275B92DC4638E',
    MARKET_GRADUATION: '0xD404E8AA4C73238CCFe5F1E61128015525DB4f4E',
    WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
    SOMNEX_INTEGRATION: '0xb9563C346537427aa41876aa4720902268dCdB40',
    SOMNEX_FACTORY: '0x46C6FBD364325aE500d1A5a3A7A32B34ec5c5e73',
    SOMNEX_ROUTER: '0x28783c7Af9bCF35cA9b5417077daBcB274D64537',
  }
};

export const getContractAddresses = (isTestnet: boolean) => {
  return isTestnet ? CONTRACT_ADDRESSES.testnet : CONTRACT_ADDRESSES.mainnet;
};

export const getSomnexConfig = (isTestnet: boolean) => {
  const addresses = getContractAddresses(isTestnet);
  return {
    integration: addresses.SOMNEX_INTEGRATION,
    factory: addresses.SOMNEX_FACTORY,
    router: addresses.SOMNEX_ROUTER,
    wstt: addresses.WSOMI,
  };
};