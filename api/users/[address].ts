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
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'isWhitelisted',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'isBlacklisted',
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
    const [canCreateToken, isWhitelisted, isBlacklisted] = await Promise.all([
      client.readContract({
        address: CONTRACT_ADDRESSES.USER_MANAGER,
        abi: USER_MANAGEMENT_ABI,
        functionName: 'canCreateToken',
        args: [address as `0x${string}`],
      }).catch(() => false),
      client.readContract({
        address: CONTRACT_ADDRESSES.USER_MANAGER,
        abi: USER_MANAGEMENT_ABI,
        functionName: 'isWhitelisted',
        args: [address as `0x${string}`],
      }).catch(() => false),
      client.readContract({
        address: CONTRACT_ADDRESSES.USER_MANAGER,
        abi: USER_MANAGEMENT_ABI,
        functionName: 'isBlacklisted',
        args: [address as `0x${string}`],
      }).catch(() => false),
    ]);

    return res.status(200).json({
      success: true,
      user: {
        address,
        canCreateToken,
        isWhitelisted,
        isBlacklisted,
      },
    });
  } catch (error: any) {
    console.error('Error in users/[address] API:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user data',
      message: error.message,
    });
  }
}
