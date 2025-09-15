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

    console.log('buyTokens called with:', { tokenAddress, sttAmount, address });
    
    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
        abi: BONDING_CURVE_ABI,
        functionName: 'buyTokens',
        args: [tokenAddress, address, parseEther(sttAmount)],
        value: parseEther(sttAmount),
      });
      
      console.log('buyTokens returned hash:', hash, 'type:', typeof hash);
      
      if (!hash) {
        throw new Error('No transaction hash received from writeContract');
      }
      
      return hash;
    } catch (error) {
      console.error('buyTokens error:', error);
      throw error;
    }
  };

  const sellTokens = async (tokenAddress: string, tokenAmount: string) => {
    if (!CONTRACT_ADDRESSES.BONDING_CURVE) {
      throw new Error('Bonding Curve contract not deployed');
    }

    console.log('sellTokens called with:', { tokenAddress, tokenAmount, address });
    
    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
        abi: BONDING_CURVE_ABI,
        functionName: 'sellTokens',
        args: [tokenAddress, address, parseEther(tokenAmount)],
      });
      
      console.log('sellTokens returned hash:', hash, 'type:', typeof hash);
      
      if (!hash) {
        throw new Error('No transaction hash received from writeContract');
      }
      
      return hash;
    } catch (error) {
      console.error('sellTokens error:', error);
      throw error;
    }
  };

  const approveToken = async (tokenAddress: string, amount: string) => {
    console.log('approveToken called with:', { tokenAddress, amount });
    
    try {
      const hash = await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: MEME_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.BONDING_CURVE, parseEther(amount)],
      });
      
      console.log('approveToken returned hash:', hash, 'type:', typeof hash);
      
      if (!hash) {
        throw new Error('No transaction hash received from writeContract');
      }
      
      return hash;
    } catch (error) {
      console.error('approveToken error:', error);
      throw error;
    }
  };

  const initializeCurve = async (tokenAddress: string) => {
    if (!CONTRACT_ADDRESSES.BONDING_CURVE) {
      throw new Error('Bonding Curve contract not deployed');
    }

    return writeContract({
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
  const isDemoToken = tokenAddress === '0x1234567890123456789012345678901234567890';
  
  // First get curve info to check if curve exists
  const { data: curveInfo, isLoading: curveLoading, error: curveError } = useReadContract({
    address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
    abi: BONDING_CURVE_ABI,
    functionName: 'getCurveInfo',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.BONDING_CURVE && !!tokenAddress && !isDemoToken,
    },
  });

  // Use getPrice with amount 1 ETH to get price per token - only if curve exists
  const { data: price, isLoading: priceLoading, error: priceError } = useReadContract({
    address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
    abi: BONDING_CURVE_ABI,
    functionName: 'getPrice',
    args: [tokenAddress, parseEther('1')],
    query: {
      enabled: !!CONTRACT_ADDRESSES.BONDING_CURVE && 
               !!tokenAddress && 
               !isDemoToken && 
               !!curveInfo, // Only call if we have curve info
    },
  });

  console.log('useTokenPrice - tokenAddress:', tokenAddress);
  console.log('useTokenPrice - curveInfo:', curveInfo);
  console.log('useTokenPrice - curveError:', curveError);
  console.log('useTokenPrice - price for 1 STT:', price);
  console.log('useTokenPrice - priceError:', priceError);

  // For demo token, return fake price
  if (isDemoToken) {
    return {
      price: '0.000005',
      isLoading: false,
      error: null,
    };
  }

  // Calculate price from curve data if available
  if (curveInfo) {
    const curve = curveInfo as any;
    console.log('Curve details for', tokenAddress, ':', {
      soldSupply: curve.soldSupply?.toString(),
      sttCollected: curve.sttCollected?.toString(), 
      virtualSttReserves: curve.virtualSttReserves?.toString(),
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
    if (curve.virtualSttReserves && curve.virtualTokenReserves) {
      try {
        const virtualStt = BigInt(curve.virtualSttReserves.toString());
        const virtualTokens = BigInt(curve.virtualTokenReserves.toString());
        const soldSupply = BigInt(curve.soldSupply?.toString() || '0');
        
        // Calculate available tokens: virtualTokens - soldSupply
        const availableTokens = virtualTokens - soldSupply;
        
        if (availableTokens > 0n) {
          // Price per token: virtualSTT / availableTokens
          const pricePerToken = (virtualStt * parseEther('1')) / availableTokens;
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
  const isDemoToken = tokenAddress === '0x1234567890123456789012345678901234567890';
  
  const { data: tokenInfo, isLoading: tokenLoading, error: tokenError, refetch: refetchTokenInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY as `0x${string}`,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getTokenMetadata',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.TOKEN_FACTORY && !!tokenAddress && !isDemoToken,
      retry: 3,
    },
  });

  const { data: curveInfo, isLoading: curveLoading, error: curveError, refetch: refetchCurveInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
    abi: BONDING_CURVE_ABI,
    functionName: 'getCurveInfo',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.BONDING_CURVE && !!tokenAddress && !isDemoToken,
      retry: 3,
    },
  });

  const { data: isGraduated, error: graduationError, refetch: refetchGraduation } = useReadContract({
    address: CONTRACT_ADDRESSES.MARKET_GRADUATION as `0x${string}`,
    abi: MARKET_GRADUATION_ABI,
    functionName: 'isGraduated',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.MARKET_GRADUATION && !!tokenAddress && !isDemoToken,
      retry: 3,
    },
  });

  console.log('useTokenInfo - tokenAddress:', tokenAddress);
  console.log('useTokenInfo - tokenInfo:', tokenInfo);
  console.log('useTokenInfo - tokenError:', tokenError);
  console.log('useTokenInfo - curveInfo:', curveInfo);
  console.log('useTokenInfo - curveError:', curveError);
  console.log('useTokenInfo - graduationError:', graduationError);

  // For demo token, return null (let component handle demo data)
  if (isDemoToken) {
    return {
      tokenInfo: null,
      isLoading: false,
      error: null,
    };
  }

  // If we have token metadata, return it even if curve info is missing
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
        sttRaised: curveInfo ? formatEther((curveInfo as any).sttCollected || 0) : '0',
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
  const { data: tokens, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY as `0x${string}`,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getAllTokens',
    query: {
      enabled: !!CONTRACT_ADDRESSES.TOKEN_FACTORY,
      refetchInterval: 10000,
      retry: 3,
    },
  });

  console.log('useAllTokens - CONTRACT_ADDRESSES.TOKEN_FACTORY:', CONTRACT_ADDRESSES.TOKEN_FACTORY);
  console.log('useAllTokens - tokens data:', tokens);
  console.log('useAllTokens - isLoading:', isLoading);
  console.log('useAllTokens - error:', error);

  // Add debugging for contract address validity
  if (!CONTRACT_ADDRESSES.TOKEN_FACTORY) {
    console.error('TOKEN_FACTORY address is missing from CONTRACT_ADDRESSES');
  }

  return {
    tokens: (tokens as string[]) || [],
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