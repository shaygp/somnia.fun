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
  FEE_MANAGER: '0xa54BcA9BC27A77037D709248aB4F8f23b3f5bc5c' as const,
};

const FEE_MANAGER_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'getTokenFees',
    outputs: [
      { internalType: 'uint256', name: 'totalFees', type: 'uint256' },
      { internalType: 'uint256', name: 'pendingFees', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const client = createPublicClient({
  chain: somnia,
  transport: http(),
});

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

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Token address is required',
    });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(token)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid token address format',
    });
  }

  try {
    const feeData = await client.readContract({
      address: CONTRACT_ADDRESSES.FEE_MANAGER,
      abi: FEE_MANAGER_ABI,
      functionName: 'getTokenFees',
      args: [token as `0x${string}`],
    }).catch(() => null);

    if (!feeData) {
      return res.status(200).json({
        success: true,
        token,
        totalFees: '0',
        pendingFees: '0',
      });
    }

    return res.status(200).json({
      success: true,
      token,
      totalFees: formatEther(feeData[0]),
      pendingFees: formatEther(feeData[1]),
    });
  } catch (error: any) {
    console.error('Error in fees/[token] API:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch fee data',
      message: error.message,
    });
  }
}
