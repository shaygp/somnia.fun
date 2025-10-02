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
    const [metadata, curveInfo, isGraduated] = await Promise.all([
      client.readContract({
        address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'getTokenMetadata',
        args: [tokenAddress as `0x${string}`],
      }),
      client.readContract({
        address: CONTRACT_ADDRESSES.BONDING_CURVE,
        abi: BONDING_CURVE_ABI,
        functionName: 'getCurveInfo',
        args: [tokenAddress as `0x${string}`],
      }),
      client.readContract({
        address: CONTRACT_ADDRESSES.MARKET_GRADUATION,
        abi: MARKET_GRADUATION_ABI,
        functionName: 'isGraduated',
        args: [tokenAddress as `0x${string}`],
      }),
    ]);

    return {
      address: tokenAddress,
      name: metadata[0],
      symbol: metadata[1],
      logo: metadata[2],
      description: metadata[3],
      creator: metadata[4],
      createdAt: Number(metadata[5]),
      totalSupply: formatEther(metadata[6]),
      active: metadata[7],
      somiRaised: formatEther(curveInfo[1]),
      tokensSold: formatEther(curveInfo[0]),
      graduated: isGraduated,
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
    const allTokens = await client.readContract({
      address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'getAllTokens',
    });

    const tokensData = await Promise.all(
      (allTokens as string[]).map((tokenAddress: string) => getTokenData(tokenAddress))
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
