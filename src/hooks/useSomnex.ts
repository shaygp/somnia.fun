import { useWriteContract, useReadContract, useAccount, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useToast } from '@/hooks/use-toast';

const SOMNEX_INTEGRATION_ABI = [
  {
    inputs: [{ name: "token", type: "address" }],
    name: "checkGraduation",
    outputs: [
      { name: "canGraduate", type: "bool" },
      { name: "sttCollected", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "graduateTokenToSomnex",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "listOnSomnexDEX",
    outputs: [{ name: "pairAddress", type: "address" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" }
    ],
    name: "getQuote",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "recipient", type: "address" }
    ],
    name: "swapTokens",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "tokenOut", type: "address" },
      { name: "amountOutMin", type: "uint256" },
      { name: "recipient", type: "address" }
    ],
    name: "swapETHForTokens",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "recipient", type: "address" }
    ],
    name: "swapTokensForETH",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getTokenPrice",
    outputs: [{ name: "priceInSTT", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "isGraduated",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getPairAddress",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
];

const SOMNEX_CONTRACT_ADDRESSES = {
  mainnet: '0x1234567890123456789012345678901234567890',
  testnet: '0x0987654321098765432109876543210987654321'
};

export const useSomnexSwap = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContract } = useWriteContract();
  const { toast } = useToast();

  const isTestnet = chainId === 50311;
  const somnexAddress = isTestnet ? SOMNEX_CONTRACT_ADDRESSES.testnet : SOMNEX_CONTRACT_ADDRESSES.mainnet;

  const getQuote = (tokenIn: string, tokenOut: string, amountIn: string) => {
    if (!amountIn || isNaN(parseFloat(amountIn))) return "0";

    const mockRate = 0.95;
    return (parseFloat(amountIn) * mockRate).toFixed(6);
  };

  const executeSwap = async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippage: string
  ) => {
    if (!address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to swap",
        variant: "destructive"
      });
      return;
    }

    const amountInWei = parseEther(amountIn);
    const expectedOut = getQuote(tokenIn, tokenOut, amountIn);
    const minOut = parseFloat(expectedOut) * (1 - parseFloat(slippage) / 100);
    const amountOutMinWei = parseEther(minOut.toString());

    try {
      if (tokenIn === "STT") {
        return writeContract({
          address: somnexAddress as `0x${string}`,
          abi: SOMNEX_INTEGRATION_ABI,
          functionName: 'swapETHForTokens',
          args: [tokenOut, amountOutMinWei, address],
          value: amountInWei,
        });
      } else if (tokenOut === "STT") {
        return writeContract({
          address: somnexAddress as `0x${string}`,
          abi: SOMNEX_INTEGRATION_ABI,
          functionName: 'swapTokensForETH',
          args: [tokenIn, amountInWei, amountOutMinWei, address],
        });
      } else {
        return writeContract({
          address: somnexAddress as `0x${string}`,
          abi: SOMNEX_INTEGRATION_ABI,
          functionName: 'swapTokens',
          args: [tokenIn, tokenOut, amountInWei, amountOutMinWei, address],
        });
      }
    } catch (error: any) {
      toast({
        title: "Swap Failed",
        description: error?.message || "Failed to execute swap",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    executeSwap,
    getQuote
  };
};

export const useSomnexGraduation = (tokenAddress: string) => {
  const chainId = useChainId();
  const { writeContract } = useWriteContract();
  const { toast } = useToast();

  const isTestnet = chainId === 50311;
  const somnexAddress = isTestnet ? SOMNEX_CONTRACT_ADDRESSES.testnet : SOMNEX_CONTRACT_ADDRESSES.mainnet;

  const { data: canGraduate, isLoading: checkingGraduation } = useReadContract({
    address: somnexAddress as `0x${string}`,
    abi: SOMNEX_INTEGRATION_ABI,
    functionName: 'checkGraduation',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  const { data: isGraduated } = useReadContract({
    address: somnexAddress as `0x${string}`,
    abi: SOMNEX_INTEGRATION_ABI,
    functionName: 'isGraduated',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  const { data: pairAddress } = useReadContract({
    address: somnexAddress as `0x${string}`,
    abi: SOMNEX_INTEGRATION_ABI,
    functionName: 'getPairAddress',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  const graduateToken = async () => {
    if (!tokenAddress) {
      toast({
        title: "Error",
        description: "Invalid token address",
        variant: "destructive"
      });
      return;
    }

    try {
      const hash = await writeContract({
        address: somnexAddress as `0x${string}`,
        abi: SOMNEX_INTEGRATION_ABI,
        functionName: 'graduateTokenToSomnex',
        args: [tokenAddress],
      });

      toast({
        title: "Graduation Initiated",
        description: "Token is being graduated to Somnex DEX...",
      });

      return hash;
    } catch (error: any) {
      toast({
        title: "Graduation Failed",
        description: error?.message || "Failed to graduate token",
        variant: "destructive"
      });
      throw error;
    }
  };

  const listOnSomnex = async () => {
    if (!tokenAddress) {
      toast({
        title: "Error",
        description: "Invalid token address",
        variant: "destructive"
      });
      return;
    }

    try {
      const hash = await writeContract({
        address: somnexAddress as `0x${string}`,
        abi: SOMNEX_INTEGRATION_ABI,
        functionName: 'listOnSomnexDEX',
        args: [tokenAddress],
        value: parseEther('36'),
      });

      toast({
        title: "Listing Initiated",
        description: "Token is being listed on Somnex DEX...",
      });

      return hash;
    } catch (error: any) {
      toast({
        title: "Listing Failed",
        description: error?.message || "Failed to list token on Somnex",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    canGraduate: canGraduate ? (canGraduate as any)[0] : false,
    sttCollected: canGraduate ? formatEther((canGraduate as any)[1]) : '0',
    isGraduated: isGraduated as boolean || false,
    pairAddress: pairAddress as string || null,
    checkingGraduation,
    graduateToken,
    listOnSomnex
  };
};

export const useSomnexTokenPrice = (tokenAddress: string) => {
  const chainId = useChainId();
  const isTestnet = chainId === 50311;
  const somnexAddress = isTestnet ? SOMNEX_CONTRACT_ADDRESSES.testnet : SOMNEX_CONTRACT_ADDRESSES.mainnet;

  const { data: price, isLoading } = useReadContract({
    address: somnexAddress as `0x${string}`,
    abi: SOMNEX_INTEGRATION_ABI,
    functionName: 'getTokenPrice',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return {
    price: price ? formatEther(price as bigint) : '0',
    isLoading
  };
};

export const useSomnexPools = () => {
  const chainId = useChainId();
  const isTestnet = chainId === 50311;

  const getPools = () => {
    return [
      {
        token0: "STT",
        token1: "USDT",
        tvl: "2400000",
        volume24h: "450000",
        apr: "24.5"
      },
      {
        token0: "STT",
        token1: "WSTT",
        tvl: "1800000",
        volume24h: "320000",
        apr: "18.2"
      }
    ];
  };

  return {
    pools: getPools(),
    isTestnet
  };
};