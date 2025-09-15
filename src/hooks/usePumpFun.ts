import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { 
  CONTRACT_ADDRESSES, 
  REGISTRY_ABI,
  TOKEN_FACTORY_ABI, 
  BONDING_CURVE_ABI,
  MARKET_GRADUATION_ABI,
  USER_MANAGEMENT_ABI,
  FEE_MANAGER_ABI,
  MEME_TOKEN_ABI 
} from '../config/contracts';

export const usePumpFun = () => {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  const createToken = async (
    name: string,
    symbol: string,
    imageUri: string,
    description: string
  ) => {
    if (!CONTRACT_ADDRESSES.TOKEN_FACTORY) {
      throw new Error('Token Factory contract not deployed');
    }

    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.TOKEN_FACTORY as `0x${string}`,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'createToken',
        args: [name, symbol, parseEther('1000000000'), imageUri, description],
        value: parseEther('0.1'),
      });

      console.log('Token creation transaction hash:', hash);
      return hash;
    } catch (error) {
      console.error('Error in createToken:', error);
      throw error;
    }
  };

  const buyTokens = async (tokenAddress: string, sttAmount: string) => {
    if (!CONTRACT_ADDRESSES.BONDING_CURVE) {
      throw new Error('Bonding Curve contract not deployed');
    }

    return writeContract({
      address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
      abi: BONDING_CURVE_ABI,
      functionName: 'buyTokens',
      args: [address, tokenAddress, parseEther(sttAmount)],
      value: parseEther(sttAmount),
    });
  };

  const sellTokens = async (tokenAddress: string, tokenAmount: string) => {
    if (!CONTRACT_ADDRESSES.BONDING_CURVE) {
      throw new Error('Bonding Curve contract not deployed');
    }

    return writeContract({
      address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
      abi: BONDING_CURVE_ABI,
      functionName: 'sellTokens',
      args: [address, tokenAddress, parseEther(tokenAmount)],
    });
  };

  const approveToken = async (tokenAddress: string, amount: string) => {
    return writeContract({
      address: tokenAddress as `0x${string}`,
      abi: MEME_TOKEN_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.BONDING_CURVE, parseEther(amount)],
    });
  };

  return {
    createToken,
    buyTokens,
    sellTokens,
    approveToken,
  };
};

export const useTokenPrice = (tokenAddress: string) => {
  const { data: price, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
    abi: BONDING_CURVE_ABI,
    functionName: 'getCurrentPrice',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.BONDING_CURVE && !!tokenAddress,
    },
  });

  return {
    price: price ? formatEther(price as bigint) : '0',
    isLoading,
    error,
  };
};

export const useTokenInfo = (tokenAddress: string) => {
  const { data: tokenInfo, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY as `0x${string}`,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getTokenInfo',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.TOKEN_FACTORY && !!tokenAddress,
    },
  });

  const { data: curveInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
    abi: BONDING_CURVE_ABI,
    functionName: 'getCurveInfo',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.BONDING_CURVE && !!tokenAddress,
    },
  });

  const { data: isGraduated } = useReadContract({
    address: CONTRACT_ADDRESSES.MARKET_GRADUATION as `0x${string}`,
    abi: MARKET_GRADUATION_ABI,
    functionName: 'isGraduated',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.MARKET_GRADUATION && !!tokenAddress,
    },
  });

  return {
    tokenInfo: tokenInfo ? {
      tokenAddress: (tokenInfo as any)[0],
      creator: (tokenInfo as any)[1],
      createdAt: (tokenInfo as any)[2],
      totalSupply: formatEther((tokenInfo as any)[3]),
      name: (tokenInfo as any)[4],
      symbol: (tokenInfo as any)[5],
      imageUri: (tokenInfo as any)[6],
      description: (tokenInfo as any)[7],
      sttRaised: curveInfo ? formatEther((curveInfo as any)[2]) : '0',
      tokensSold: curveInfo ? formatEther((curveInfo as any)[3]) : '0',
      graduatedToDeX: isGraduated || false,
    } : null,
    isLoading,
    error,
  };
};

export const useAllTokens = () => {
  const { data: tokens, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY as `0x${string}`,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getAllTokens',
    query: {
      enabled: !!CONTRACT_ADDRESSES.TOKEN_FACTORY,
    },
  });

  return {
    tokens: tokens as string[] || [],
    isLoading,
    error,
  };
};

export const useTokenBalance = (tokenAddress: string, userAddress?: string) => {
  const { address } = useAccount();
  const targetAddress = userAddress || address;

  const { data: balance, isLoading, error } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: MEME_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [targetAddress],
    query: {
      enabled: !!tokenAddress && !!targetAddress,
    },
  });

  return {
    balance: balance ? formatEther(balance as bigint) : '0',
    isLoading,
    error,
  };
};

export const useTokenQuotes = (tokenAddress: string) => {
  const getTokensForStt = (sttAmount: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
      abi: BONDING_CURVE_ABI,
      functionName: 'calculateTokensOut',
      args: [tokenAddress, parseEther(sttAmount)],
      query: {
        enabled: !!CONTRACT_ADDRESSES.BONDING_CURVE && !!tokenAddress && !!sttAmount,
      },
    });
  };

  const getSttForTokens = (tokenAmount: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
      abi: BONDING_CURVE_ABI,
      functionName: 'calculateSttOut',
      args: [tokenAddress, parseEther(tokenAmount)],
      query: {
        enabled: !!CONTRACT_ADDRESSES.BONDING_CURVE && !!tokenAddress && !!tokenAmount,
      },
    });
  };

  return {
    getTokensForStt,
    getSttForTokens,
  };
};

export const useGraduation = (tokenAddress: string) => {
  const { data: graduationData, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.MARKET_GRADUATION as `0x${string}`,
    abi: MARKET_GRADUATION_ABI,
    functionName: 'checkGraduation',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.MARKET_GRADUATION && !!tokenAddress,
    },
  });

  return {
    canGraduate: graduationData ? (graduationData as any)[0] : false,
    sttCollected: graduationData ? formatEther((graduationData as any)[1]) : '0',
    isLoading,
    error,
  };
};

export const usePendingRewards = () => {
  const { address } = useAccount();
  
  const { data: pendingRewards, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.FEE_MANAGER as `0x${string}`,
    abi: FEE_MANAGER_ABI,
    functionName: 'getPendingRewards',
    args: [address],
    query: {
      enabled: !!CONTRACT_ADDRESSES.FEE_MANAGER && !!address,
    },
  });

  const { writeContract } = useWriteContract();
  
  const claimRewards = async () => {
    if (!CONTRACT_ADDRESSES.FEE_MANAGER) {
      throw new Error('Fee Manager contract not deployed');
    }

    return writeContract({
      address: CONTRACT_ADDRESSES.FEE_MANAGER as `0x${string}`,
      abi: FEE_MANAGER_ABI,
      functionName: 'claimRewards',
      args: [],
    });
  };

  return {
    pendingRewards: pendingRewards ? formatEther(pendingRewards as bigint) : '0',
    isLoading,
    error,
    claimRewards,
  };
};

export const useUserAccess = () => {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  
  const { data: canCreateToken, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.USER_MANAGER as `0x${string}`,
    abi: USER_MANAGEMENT_ABI,
    functionName: 'canCreateToken',
    args: [address],
    query: {
      enabled: !!CONTRACT_ADDRESSES.USER_MANAGER && !!address,
    },
  });

  const validateAccess = async () => {
    if (!CONTRACT_ADDRESSES.USER_MANAGER) {
      throw new Error('User Manager contract not deployed');
    }

    return writeContract({
      address: CONTRACT_ADDRESSES.USER_MANAGER as `0x${string}`,
      abi: USER_MANAGEMENT_ABI,
      functionName: 'validateAccess',
      args: [address],
    });
  };

  return {
    canCreateToken: canCreateToken as boolean || false,
    isLoading,
    validateAccess,
  };
};