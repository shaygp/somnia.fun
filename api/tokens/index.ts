import { createPublicClient, http, formatEther } from 'viem';
import { defineChain } from 'viem';

const somnia = defineChain({
  id: 5031,
  name: 'Somnia',
  network: 'somnia',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia',
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
    default: { name: 'Explorer', url: 'https://explorer.somnia.network' },
  },
});

const CONTRACT_ADDRESSES = {
  TOKEN_FACTORY: '0xeeC988BB024C876112c56E96E82dB87fc18e8116' as const,
  BONDING_CURVE: '0x4650141E4276bB3AB54d81A7dc3EC86DfFfBD45B' as const,
  MARKET_GRADUATION: '0x9e34699767454d90f6315394c7F0d5E00e9Ad376' as const,
};

const TOKEN_FACTORY_ABI = [
  {
    inputs: [],
    name: 'getAllTokens',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'tokenAddress', type: 'address' }],
    name: 'getTokenMetadata',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' },
          { internalType: 'string', name: 'imageUri', type: 'string' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'address', name: 'creator', type: 'address' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'totalSupply', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct TokenFactory.TokenMetadata',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const BONDING_CURVE_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'getCurveInfo',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'soldSupply', type: 'uint256' },
          { internalType: 'uint256', name: 'somiCollected', type: 'uint256' },
          { internalType: 'uint256', name: 'virtualSomiReserves', type: 'uint256' },
          { internalType: 'uint256', name: 'virtualTokenReserves', type: 'uint256' },
          { internalType: 'bool', name: 'graduated', type: 'bool' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct BondingCurveContract.TokenCurve',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const MARKET_GRADUATION_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'isGraduated',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const client = createPublicClient({
  chain: somnia,
  transport: http(),
});

async function getTokenData(tokenAddress: string) {
  try {
    const [explorerTokenResponse, transfersResponse] = await Promise.all([
      fetch(`https://explorer.somnia.network/api/v2/addresses/${tokenAddress}`),
      fetch(`https://explorer.somnia.network/api/v2/tokens/${tokenAddress}/transfers`)
    ]);

    const explorerTokenData = await explorerTokenResponse.json();
    const transfersData = await transfersResponse.json();

    let tokensSold = 0;
    let somiRaised = 0;

    if (transfersData.items && Array.isArray(transfersData.items)) {
      const relevantTransfers = transfersData.items.filter(
        transfer => transfer.from.hash.toLowerCase() === CONTRACT_ADDRESSES.BONDING_CURVE.toLowerCase()
      );

      const txPromises = relevantTransfers.map(transfer =>
        fetch(`https://explorer.somnia.network/api/v2/transactions/${transfer.transaction_hash}`)
          .then(res => res.json())
          .catch(() => null)
      );

      const txResults = await Promise.all(txPromises);

      relevantTransfers.forEach((transfer, index) => {
        const amount = parseFloat(formatEther(transfer.total.value));
        tokensSold += amount;

        const txData = txResults[index];
        if (txData?.value) {
          somiRaised += parseFloat(formatEther(txData.value));
        }
      });
    }

    return {
      address: tokenAddress,
      name: explorerTokenData.name || 'Unknown Token',
      symbol: explorerTokenData.token?.symbol || explorerTokenData.name || 'TKN',
      logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${tokenAddress}`,
      description: '',
      creator: explorerTokenData.creator_address_hash || '0x0',
      createdAt: explorerTokenData.timestamp ? new Date(explorerTokenData.timestamp).getTime() : Date.now(),
      totalSupply: explorerTokenData.token?.total_supply ? formatEther(explorerTokenData.token.total_supply) : '1000000000',
      active: true,
      somiRaised: somiRaised.toString(),
      tokensSold: tokensSold.toString(),
      graduated: somiRaised >= 10000,
      tradingLink: `https://tradesomnia.fun/token/${tokenAddress}`,
    };
  } catch (error) {
    console.error(`Error fetching data for token ${tokenAddress}:`, error);
    return null;
  }
}

const TOKEN_CREATED_EVENT = '0x2d49c5d1b01e5c0e0d3c2d4e8c38f32a6b41f6e8e2b02ab8f32a6b41f6e8e2b0';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const explorerResponse = await fetch(
      `https://explorer.somnia.network/api/v2/addresses/${CONTRACT_ADDRESSES.TOKEN_FACTORY}/internal-transactions`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!explorerResponse.ok) {
      throw new Error(`Explorer API returned ${explorerResponse.status}`);
    }

    const txData = await explorerResponse.json();

    console.log('Explorer response items count:', txData.items?.length || 0);

    const tokenAddresses: string[] = [];

    if (txData.items && Array.isArray(txData.items)) {
      for (const tx of txData.items) {
        if (tx.type === 'create' && tx.created_contract?.hash) {
          console.log('Found created contract:', tx.created_contract.hash);
          if (tx.created_contract.hash.toLowerCase() !== CONTRACT_ADDRESSES.TOKEN_FACTORY.toLowerCase()) {
            tokenAddresses.push(tx.created_contract.hash);
          }
        }
      }
    }

    console.log('Token addresses found:', tokenAddresses);

    const uniqueTokens = [...new Set(tokenAddresses)];

    const tokensData = await Promise.all(
      uniqueTokens.map((tokenAddress: string) => getTokenData(tokenAddress))
    );

    const validTokens = tokensData.filter((token) => token !== null);

    return res.status(200).json({
      success: true,
      count: validTokens.length,
      tokens: validTokens,
    });
  } catch (error: any) {
    console.error('Error in tokens API:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tokens',
      message: error.message,
    });
  }
}
