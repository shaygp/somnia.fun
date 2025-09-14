import { Chain } from 'wagmi';

export const somniaMainnet: Chain = {
  id: 50311,
  name: 'Somnia',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: ['https://dream.somnia.network'],
    },
    public: {
      http: ['https://dream.somnia.network'],
    },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://explorer.somnia.network' },
  },
  testnet: false,
};

export const somniaTestnet: Chain = {
  id: 50311,
  name: 'Somnia Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: ['https://dream.somnia.network'],
    },
    public: {
      http: ['https://dream.somnia.network'],
    },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://explorer.somnia.network' },
  },
  testnet: true,
};

export const CONTRACT_ADDRESSES = {
  mainnet: {
    REGISTRY: '0x0becC48729c02fC5d30239ab4E1B8c9AbB0d1f78',
    TOKEN_FACTORY: '0xa959A269696cEd243A0E2Cc45fCeD8c0A24dB88e',
    BONDING_CURVE: '0xd64fd6b463aC54252FAB669a29d51Ae3373C3467',
    LIQUIDITY_POOL: '0xDC225E7d4e3a1e5A65aC39F4B60E85f7657FFf0C',
    USER_MANAGER: '0x7231bB2Ebc50cB32731cf7303E077B0042ab6778',
    FEE_MANAGER: '0xCaCbd1C17f36061593181B6E482DaB822815c9a5',
    MARKET_GRADUATION: '0x7Df5fda5E528ba80E84C3462cA7D7454c5129c7b',
    WSTT: '0x952E6c15BEA13B9A6077419456B59f46c43F2934',
    SOMNEX_INTEGRATION: '0x1234567890123456789012345678901234567890',
    SOMNEX_FACTORY: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    SOMNEX_ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  },
  testnet: {
    REGISTRY: '0x0becC48729c02fC5d30239ab4E1B8c9AbB0d1f78',
    TOKEN_FACTORY: '0xa959A269696cEd243A0E2Cc45fCeD8c0A24dB88e',
    BONDING_CURVE: '0xd64fd6b463aC54252FAB669a29d51Ae3373C3467',
    LIQUIDITY_POOL: '0xDC225E7d4e3a1e5A65aC39F4B60E85f7657FFf0C',
    USER_MANAGER: '0x7231bB2Ebc50cB32731cf7303E077B0042ab6778',
    FEE_MANAGER: '0xCaCbd1C17f36061593181B6E482DaB822815c9a5',
    MARKET_GRADUATION: '0x7Df5fda5E528ba80E84C3462cA7D7454c5129c7b',
    WSTT: '0x952E6c15BEA13B9A6077419456B59f46c43F2934',
    SOMNEX_INTEGRATION: '0x0987654321098765432109876543210987654321',
    SOMNEX_FACTORY: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    SOMNEX_ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
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
    wstt: addresses.WSTT,
  };
};