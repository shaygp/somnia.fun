import { createPublicClient, http } from 'viem';
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
  USER_MANAGER: '0x7231bB2Ebc50cB32731cf7303E077B0042ab6778' as const,
};

const USER_MANAGEMENT_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'canCreateToken',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
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

  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'User address is required',
    });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid address format',
    });
  }

  try {
    const canCreateToken = await client.readContract({
      address: CONTRACT_ADDRESSES.USER_MANAGER,
      abi: USER_MANAGEMENT_ABI,
      functionName: 'canCreateToken',
      args: [address as `0x${string}`],
    });

    return res.status(200).json({
      success: true,
      address,
      canCreateToken,
    });
  } catch (error: any) {
    console.error('Error in users/canCreateToken/[address] API:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check user permissions',
      message: error.message,
    });
  }
}
