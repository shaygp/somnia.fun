import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState, useEffect } from 'react';
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
  const { writeContractAsync } = useWriteContract();

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
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TOKEN_FACTORY as `0x${string}`,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'createToken',
        args: [name, symbol, parseEther('1000000000'), imageUri, description],
        value: parseEther('10'),
      });

      console.log('Token creation transaction hash:', hash, 'type:', typeof hash);
      
      if (!hash) {
        throw new Error('No transaction hash received from writeContract');
      }
      
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

    
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
        abi: BONDING_CURVE_ABI,
        functionName: 'buyTokens',
        args: [tokenAddress, address, parseEther(sttAmount)],
        value: parseEther(sttAmount),
      });
      
      
      if (!hash) {
        throw new Error('No transaction hash received from writeContract');
      }
      
      return hash;
    } catch (error) {
      throw error;
    }
  };

  const sellTokens = async (tokenAddress: string, tokenAmount: string) => {
    if (!CONTRACT_ADDRESSES.BONDING_CURVE) {
      throw new Error('Bonding Curve contract not deployed');
    }

    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
        abi: BONDING_CURVE_ABI,
        functionName: 'sellTokens',
        args: [tokenAddress, address, parseEther(tokenAmount)],
      });

      if (!hash) {
        throw new Error('No transaction hash received from writeContract');
      }

      return hash;
    } catch (error) {
      throw error;
    }
  };

  const approveToken = async (tokenAddress: string, amount: string) => {
    
    try {
      const hash = await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: MEME_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.BONDING_CURVE, parseEther(amount)],
      });
      
      
      if (!hash) {
        throw new Error('No transaction hash received from writeContract');
      }
      
      return hash;
    } catch (error) {
      throw error;
    }
  };

  const initializeCurve = async (tokenAddress: string) => {
    if (!CONTRACT_ADDRESSES.BONDING_CURVE) {
      throw new Error('Bonding Curve contract not deployed');
    }

    return writeContractAsync({
      address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
      abi: BONDING_CURVE_ABI,
      functionName: 'initializeCurve',
      args: [tokenAddress],
    });
  };

  return {
    createToken,
    buyTokens,
    sellTokens,
    approveToken,
    initializeCurve,
  };
};

export const useTokenPrice = (tokenAddress: string) => {
  const { data: curveInfo, isLoading: curveLoading, error: curveError } = useReadContract({
    address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
    abi: BONDING_CURVE_ABI,
    functionName: 'getCurveInfo',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.BONDING_CURVE && !!tokenAddress,
    },
  });

  const { data: price, isLoading: priceLoading, error: priceError } = useReadContract({
    address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
    abi: BONDING_CURVE_ABI,
    functionName: 'getPrice',
    args: [tokenAddress, parseEther('1')],
    query: {
      enabled: !!CONTRACT_ADDRESSES.BONDING_CURVE &&
               !!tokenAddress &&
               !!curveInfo,
    },
  });

  console.log('useTokenPrice - tokenAddress:', tokenAddress);
  console.log('useTokenPrice - curveInfo:', curveInfo);
  console.log('useTokenPrice - curveError:', curveError);
  console.log('useTokenPrice - price for 1 SOMI:', price);
  console.log('useTokenPrice - priceError:', priceError);

  // Calculate price from curve data if available
  if (curveInfo) {
    const curve = curveInfo as any;
    console.log('Curve details for', tokenAddress, ':', {
      soldSupply: curve.soldSupply?.toString(),
      somiCollected: curve.somiCollected?.toString(),
      virtualSomiReserves: curve.virtualSomiReserves?.toString(),
      virtualTokenReserves: curve.virtualTokenReserves?.toString(),
      active: curve.active,
      graduated: curve.graduated
    });

    // If graduated, price should be 0 (traded on DEX)
    if (curve.graduated) {
      return {
        price: '0',
        isLoading: false,
        error: null,
      };
    }

    // If we have price data from getPrice call, use it
    if (price && !priceError) {
      return {
        price: formatEther(price as bigint),
        isLoading: false,
        error: null,
      };
    }

    // Calculate price from curve reserves (fallback method)
    if (curve.virtualSomiReserves && curve.virtualTokenReserves) {
      try {
        const virtualSomi = BigInt(curve.virtualSomiReserves.toString());
        const virtualTokens = BigInt(curve.virtualTokenReserves.toString());
        const soldSupply = BigInt(curve.soldSupply?.toString() || '0');

        // Calculate available tokens: virtualTokens - soldSupply
        const availableTokens = virtualTokens - soldSupply;

        if (availableTokens > 0n) {
          // Price per token: virtualSOMI / availableTokens
          const pricePerToken = (virtualSomi * parseEther('1')) / availableTokens;
          return {
            price: formatEther(pricePerToken),
            isLoading: false,
            error: null,
          };
        }
      } catch (error) {
        console.error('Error calculating price from curve data:', error);
      }
    }

    // If curve exists but we can't calculate price, return 0
    return {
      price: '0',
      isLoading: false,
      error: null,
    };
  }

  // If no curve info and still loading, show loading state
  if (curveLoading) {
    return {
      price: '0',
      isLoading: true,
      error: null,
    };
  }

  // No curve info available
  return {
    price: '0',
    isLoading: false,
    error: curveError || new Error('No curve data available for this token'),
  };
};

export const useTokenInfo = (tokenAddress: string) => {
  const { data: tokenInfo, isLoading: tokenLoading, error: tokenError, refetch: refetchTokenInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY as `0x${string}`,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getTokenMetadata',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.TOKEN_FACTORY && !!tokenAddress,
      retry: 3,
    },
  });

  const { data: curveInfo, isLoading: curveLoading, error: curveError, refetch: refetchCurveInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
    abi: BONDING_CURVE_ABI,
    functionName: 'getCurveInfo',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.BONDING_CURVE && !!tokenAddress,
      retry: 3,
    },
  });

  const { data: isGraduated, error: graduationError, refetch: refetchGraduation } = useReadContract({
    address: CONTRACT_ADDRESSES.MARKET_GRADUATION as `0x${string}`,
    abi: MARKET_GRADUATION_ABI,
    functionName: 'isGraduated',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.MARKET_GRADUATION && !!tokenAddress,
      retry: 3,
    },
  });

  console.log('useTokenInfo - tokenAddress:', tokenAddress);
  console.log('useTokenInfo - tokenInfo:', tokenInfo);
  console.log('useTokenInfo - tokenError:', tokenError);
  console.log('useTokenInfo - curveInfo:', curveInfo);
  console.log('useTokenInfo - curveError:', curveError);
  console.log('useTokenInfo - graduationError:', graduationError);

  const hasTokenInfo = tokenInfo && (tokenInfo as any).name;
  
  if (hasTokenInfo) {
    return {
      tokenInfo: {
        name: (tokenInfo as any).name || (tokenInfo as any)[0],
        symbol: (tokenInfo as any).symbol || (tokenInfo as any)[1],
        imageUri: (tokenInfo as any).imageUri || (tokenInfo as any)[2],
        description: (tokenInfo as any).description || (tokenInfo as any)[3],
        creator: (tokenInfo as any).creator || (tokenInfo as any)[4],
        createdAt: (tokenInfo as any).createdAt || (tokenInfo as any)[5],
        totalSupply: (tokenInfo as any).totalSupply ? formatEther((tokenInfo as any).totalSupply) : formatEther((tokenInfo as any)[6] || 0),
        active: (tokenInfo as any).active ?? (tokenInfo as any)[7] ?? true,
        sttRaised: curveInfo ? formatEther((curveInfo as any).somiCollected || 0) : '0',
        tokensSold: curveInfo ? formatEther((curveInfo as any).soldSupply || 0) : '0',
        graduatedToDeX: !!isGraduated,
      },
      isLoading: tokenLoading || curveLoading,
      error: tokenError,
      refetch: () => {
        refetchTokenInfo();
        refetchCurveInfo();
        refetchGraduation();
      },
    };
  }

  // Return loading/error state if no token info yet
  return {
    tokenInfo: null,
    isLoading: tokenLoading || curveLoading,
    error: tokenError || (tokenLoading ? null : new Error('Token not found in factory')),
    refetch: () => {
      refetchTokenInfo();
      refetchCurveInfo();
      refetchGraduation();
    },
  };
};

export const useAllTokens = () => {
  const [tokenAddresses, setTokenAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTokensFromAPI = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://tradesomnia.fun/api/tokens');
        const data = await response.json();

        if (data.success && data.tokens && data.tokens.length > 0) {
          const addresses = data.tokens.map((t: any) => t.address);
          setTokenAddresses(addresses);
          setError(null);
        } else {
          setTokenAddresses([]);
        }
      } catch (err) {
        console.error('Error fetching tokens from API:', err);
        setTokenAddresses([]);
        setError(err instanceof Error ? err : new Error('Failed to fetch tokens'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokensFromAPI();
    const interval = setInterval(fetchTokensFromAPI, 10000);
    return () => clearInterval(interval);
  }, []);

  const refetch = async () => {
    try {
      const response = await fetch('https://tradesomnia.fun/api/tokens');
      const data = await response.json();
      if (data.success && data.tokens) {
        const addresses = data.tokens.map((t: any) => t.address);
        setTokenAddresses(addresses);
      }
    } catch (err) {
      console.error('Error refetching tokens:', err);
    }
  };

  return {
    tokens: tokenAddresses,
    isLoading,
    error,
    refetch,
  };
};

export const useTokenBalance = (tokenAddress: string, userAddress?: string) => {
  const { address } = useAccount();
  const targetAddress = userAddress || address;

  const { data: balance, isLoading, error, refetch } = useReadContract({
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
    refetch,
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
      functionName: 'calculateSomiOut',
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

  const { writeContractAsync } = useWriteContract();
  
  const claimRewards = async () => {
    if (!CONTRACT_ADDRESSES.FEE_MANAGER) {
      throw new Error('Fee Manager contract not deployed');
    }

    return writeContractAsync({
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
  const { writeContractAsync } = useWriteContract();
  
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

    return writeContractAsync({
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