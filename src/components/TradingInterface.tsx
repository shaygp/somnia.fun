import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Loader2, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseEther } from "viem";
import { usePumpFun, useTokenPrice, useTokenInfo, useTokenBalance } from "@/hooks/usePumpFun";
import { logTransaction, validateTransactionHash } from "@/utils/debug";
import { useAccount, useWaitForTransactionReceipt, useChainId, useSwitchChain, useReadContract } from 'wagmi';
import { somniaMainnetChain } from '@/config/wagmi';
import { CONTRACT_ADDRESSES, MEME_TOKEN_ABI } from "@/config/contracts";
import { useSomnexGraduation } from "@/hooks/useSomnex";
import { Link } from "react-router-dom";
import SuccessModal from "@/components/SuccessModal";
import CurveInitializer from "@/components/CurveInitializer";

interface TradingInterfaceProps {
  tokenAddress: string;
}

export default function TradingInterface({ tokenAddress }: TradingInterfaceProps) {
  const { toast } = useToast();
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { buyTokens, sellTokens, approveToken } = usePumpFun();
  const { tokenInfo, isLoading: tokenInfoLoading, refetch: refetchTokenInfo } = useTokenInfo(tokenAddress);
  const { price, error: priceError } = useTokenPrice(tokenAddress);
  const { balance: tokenBalance, refetch: refetchBalance } = useTokenBalance(tokenAddress);
  
  // Check token allowance for selling
  const { data: allowance, refetch: refetchAllowance, error: allowanceError } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: MEME_TOKEN_ABI,
    functionName: 'allowance',
    args: [address, CONTRACT_ADDRESSES.BONDING_CURVE],
    query: {
      enabled: !!address && !!tokenAddress && !!CONTRACT_ADDRESSES.BONDING_CURVE,
      retry: 2,
    },
  });
  const { canGraduate, graduateToken, listOnSomnex } = useSomnexGraduation(tokenAddress);

  
  const [activeTab, setActiveTab] = useState("buy");
  const [sttAmount, setSttAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [isTrading, setIsTrading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    title: string;
    message: string;
    txHash: string;
    tokenInfo?: { name: string; symbol: string; amount?: string };
    type: "buy" | "sell" | "create";
  } | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const { isLoading: isConfirming, isSuccess, isError: txIsError, error: txError } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
    query: {
      enabled: !!txHash && txHash !== "",
    }
  });

  useEffect(() => {
    if (txIsError && txHash && !isSuccess) {
      console.error('Transaction failed:', txError);
      setIsTrading(false);
      setTxHash("");

      if (txError && !txError.message?.includes('user rejected')) {
        toast({
          title: "Transaction Failed",
          description: txError?.message || "Transaction failed on blockchain",
          variant: "destructive"
        });
      }
    }
  }, [txIsError, txError, txHash, toast, isSuccess]);

  const handleNetworkSwitch = async () => {
    try {
      await switchChain({ chainId: somniaMainnetChain.id });
      toast({
        title: "Network Switched",
        description: "Successfully switched to Somnia Mainnet",
      });
    } catch (error) {
      toast({
        title: "Network Switch Failed",
        description: "Please manually switch to Somnia Mainnet in your wallet",
        variant: "destructive",
      });
    }
  };

  const handleBuy = async () => {
    if (!address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to trade",
        variant: "destructive"
      });
      return;
    }

    if (chain?.id !== somniaMainnetChain.id) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Somnia Mainnet to trade",
        variant: "destructive"
      });
      handleNetworkSwitch();
      return;
    }

    if (!sttAmount) return;

    setIsTrading(true);

    try {
      toast({
        title: "Purchase Initiated",
        description: `Buying ${sttAmount} SOMI worth of ${tokenInfo.symbol} tokens...`,
      });

      const hash = await buyTokens(tokenAddress, sttAmount);
      logTransaction('Buy Tokens', hash);

      const validatedHash = validateTransactionHash(hash);
      if (validatedHash) {
        setTxHash(validatedHash);
        toast({
          title: "Transaction Submitted",
          description: `Waiting for confirmation... Hash: ${validatedHash.slice(0, 10)}...`,
        });

      } else {
        console.error('Invalid transaction hash received from buyTokens');
        toast({
          title: "Transaction Error",
          description: "Invalid transaction hash received. Please try again.",
          variant: "destructive"
        });
        setIsTrading(false);
        return;
      }

    } catch (error: any) {
      console.error("Buy error:", error);

      if (error?.message?.includes('rejected') || error?.message?.includes('denied') || error?.message?.includes('cancelled')) {
        toast({
          title: "Transaction Cancelled",
          description: "Transaction was rejected by user",
          variant: "destructive"
        });
      } else if (error?.message?.includes('insufficient')) {
        toast({
          title: "Insufficient Funds",
          description: "Insufficient funds or allowance",
          variant: "destructive"
        });
      } else {
      }

      setIsTrading(false);
    }
  };

  const handleApprove = async () => {
    if (!tokenAmount || !address) return;
    
    setIsApproving(true);
    setIsTrading(true);
    
    try {
      toast({
        title: "Approval Required",
        description: `Approving ${tokenAmount} ${tokenInfo.symbol} tokens for sale...`,
      });

      const approveHash = await approveToken(tokenAddress, tokenAmount);
      logTransaction('Approve Tokens', approveHash);
      
      const validatedHash = validateTransactionHash(approveHash);
      if (validatedHash) {
        setTxHash(validatedHash);
        toast({
          title: "Approval Submitted",
          description: `Waiting for approval confirmation... Hash: ${validatedHash.slice(0, 10)}...`,
        });
      } else {
        throw new Error("Invalid transaction hash received from approveToken");
      }
    } catch (error: any) {
      console.error("Approval error:", error);

      if (error?.message?.includes('rejected') || error?.message?.includes('denied') || error?.message?.includes('cancelled')) {
        toast({
          title: "Approval Cancelled",
          description: "Transaction was rejected by user",
          variant: "destructive"
        });
      } else {
      }

      setIsApproving(false);
      setIsTrading(false);
    }
  };

  const executeSell = async () => {
    try {
      toast({
        title: "Sale Initiated",
        description: `Selling ${tokenAmount} ${tokenInfo.symbol} tokens...`,
      });

      const hash = await sellTokens(tokenAddress, tokenAmount);
      logTransaction('Sell Tokens', hash);

      const validatedHash = validateTransactionHash(hash);
      if (validatedHash) {
        setTxHash(validatedHash);
        toast({
          title: "Transaction Submitted",
          description: `Waiting for confirmation... Hash: ${validatedHash.slice(0, 10)}...`,
        });
      } else {
        throw new Error("Invalid transaction hash received from sellTokens");
      }

    } catch (error: any) {
      console.error("Sell error:", error);

      if (error?.message?.includes('rejected') || error?.message?.includes('denied') || error?.message?.includes('cancelled')) {
        toast({
          title: "Transaction Cancelled",
          description: "Transaction was rejected by user",
          variant: "destructive"
        });
      } else if (error?.message?.includes('insufficient')) {
        toast({
          title: "Insufficient Balance",
          description: "Insufficient token balance for sale",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sale Failed",
          description: error?.message || "An error occurred during the sale",
          variant: "destructive"
        });
      }

      setIsTrading(false);
      setIsApproving(false);
    }
  };

  const handleSell = async () => {
    if (!address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to trade",
        variant: "destructive"
      });
      return;
    }

    if (chain?.id !== somniaMainnetChain.id) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Somnia Mainnet to trade",
        variant: "destructive"
      });
      handleNetworkSwitch();
      return;
    }

    if (!tokenAmount) return;

    if (parseFloat(tokenBalance) < parseFloat(tokenAmount)) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${tokenBalance} ${tokenInfo.symbol} tokens`,
        variant: "destructive"
      });
      return;
    }

    setIsTrading(true);

    try {
      const requiredAmount = parseEther(tokenAmount);
      const currentAllowance = BigInt(allowance?.toString() || '0');

      if (currentAllowance < requiredAmount) {
        toast({
          title: "Approval Required",
          description: `Approving ${tokenAmount} ${tokenInfo.symbol} for sale...`,
        });

        setIsApproving(true);
        const approvalHash = await approveToken(tokenAddress, tokenAmount);

        if (approvalHash) {
          setTxHash(approvalHash);
          toast({
            title: "Approval Submitted",
            description: "Waiting for confirmation...",
          });
          return;
        }
      } else {
        await executeSell();
      }

    } catch (error: any) {
      console.error("Sell error:", error);

      if (error?.message?.includes('rejected') || error?.message?.includes('denied') || error?.message?.includes('cancelled')) {
        toast({
          title: "Transaction Cancelled",
          description: "Transaction was rejected by user",
          variant: "destructive"
        });
      } else if (error?.message?.includes('insufficient')) {
        toast({
          title: "Insufficient Allowance",
          description: "Insufficient token allowance for sale",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sale Failed",
          description: error?.message || "An error occurred during the sale",
          variant: "destructive"
        });
      }

      setIsTrading(false);
      setIsApproving(false);
    }
  };

  useEffect(() => {

    if (isSuccess && txHash && tokenInfo) {

      if (isApproving) {
        setIsApproving(false);
        setTxHash("");

        refetchAllowance();

        toast({
          title: "Approval Confirmed!",
          description: "Proceeding with sale...",
        });

        setTimeout(async () => {
          await refetchAllowance();
          await executeSell();
        }, 2000);

        setForceUpdate(prev => prev + 1);
        return;
      }
      
      // Regular buy/sell transaction confirmed
      const isBuy = activeTab === "buy";
      const title = isBuy ? "Purchase Successful!" : "Sale Successful!";
      const message = isBuy 
        ? `You have successfully purchased ${tokenInfo.symbol} tokens` 
        : `You have successfully sold ${tokenInfo.symbol} tokens`;
      const amount = isBuy 
        ? `${sttAmount} SOMI → ${tokenInfo.symbol}` 
        : `${tokenAmount} ${tokenInfo.symbol} → SOMI`;

      setSuccessData({
        title,
        message,
        txHash,
        tokenInfo: {
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          amount
        },
        type: isBuy ? "buy" : "sell"
      });
      setShowSuccessModal(true);

      // Reset states
      setIsTrading(false);
      setTxHash("");
      if (isBuy) {
        setSttAmount("");
      } else {
        setTokenAmount("");
      }
      setNeedsApproval(false);
      setIsApproving(false);

      // Immediate refetch
      refetchBalance();
      refetchAllowance();
      refetchTokenInfo();

      // Additional refetches to ensure data consistency
      setTimeout(() => {
        refetchBalance();
        refetchAllowance();
        refetchTokenInfo();
      }, 2000);

      setTimeout(() => {
        refetchBalance();
        refetchAllowance();
        refetchTokenInfo();
      }, 5000);
    }
  }, [isSuccess, isConfirming, txIsError, activeTab, txHash, tokenInfo, sttAmount, tokenAmount, isApproving, toast, refetchAllowance, allowance]);

  // Also handle stuck loading states - if transaction is taking too long
  useEffect(() => {
    if (isTrading && !txHash) {
      // If we've been trading for more than 30 seconds without a tx hash, reset
      const timeout = setTimeout(() => {
        setIsTrading(false);
        toast({
          title: "Transaction Timeout",
          description: "Transaction took too long. Please try again.",
          variant: "destructive"
        });
      }, 30000);

      return () => clearTimeout(timeout);
    }
  }, [isTrading, txHash, toast]);

  if (tokenInfoLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading token info...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tokenInfo) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Token not found</p>
        </CardContent>
      </Card>
    );
  }

  // Show error if there's a price error that's not just normal trading issues

  const progressToGraduation = tokenInfo.graduatedToDeX ?
    100 :
    (parseFloat(tokenInfo.sttRaised) / 10000) * 100;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <img 
              src={tokenInfo.imageUri || "https://via.placeholder.com/40"} 
              alt={tokenInfo.name}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full"
            />
            <div>
              <h3 className="font-bold text-sm md:text-base">{tokenInfo.name}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">${tokenInfo.symbol}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-bold text-base md:text-lg">{parseFloat(price).toFixed(8)} SOMI</p>
            <p className="text-xs text-muted-foreground">per token</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 md:space-y-6 p-3 md:p-6">
        <CurveInitializer 
          tokenAddress={tokenAddress} 
          onInitialized={() => {
            setTimeout(() => {
              refetchAllowance();
              refetchTokenInfo();
            }, 2000);
          }} 
        />
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to Somnex DEX</span>
            <span>{tokenInfo.graduatedToDeX ? "Graduated to Somnex!" : `${tokenInfo.sttRaised}/10,000 SOMI`}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressToGraduation, 100)}%` }}
            />
          </div>
          {tokenInfo.graduatedToDeX && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                This token has graduated to Somnex DEX! 15,000 SOMI locked permanently.
              </p>
              <Button asChild size="sm" className="w-full bg-primary hover:bg-primary/90">
                <Link to="/somnex">
                  <Rocket className="w-4 h-4 mr-2" />
                  Trade on Somnex DEX
                </Link>
              </Button>
            </div>
          )}
          {canGraduate && !tokenInfo.graduatedToDeX && (
            <div className="space-y-2">
              <p className="text-sm text-green-500 font-medium">
                Ready to graduate to Somnex DEX!
              </p>
              <Button
                onClick={async () => {
                  if (!address) {
                    toast({
                      title: "Wallet Required",
                      description: "Please connect your wallet to graduate token",
                      variant: "destructive"
                    });
                    return;
                  }

                  if (chain?.id !== somniaMainnetChain.id) {
                    toast({
                      title: "Wrong Network",
                      description: "Please switch to Somnia Mainnet to graduate token",
                      variant: "destructive"
                    });
                    handleNetworkSwitch();
                    return;
                  }

                  try {
                    toast({
                      title: "Graduating Token",
                      description: "Listing token on Somnex DEX with locked liquidity...",
                    });

                    const hash = await graduateToken();

                    if (hash) {
                      toast({
                        title: "Graduation Successful!",
                        description: "Token is now listed on Somnex DEX with permanent liquidity lock",
                      });
                    }
                  } catch (error: any) {
                    console.error("Graduation error:", error);
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Graduate to Somnex
              </Button>
            </div>
          )}
        </div>

        {!tokenInfo.graduatedToDeX && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Buy</span>
              </TabsTrigger>
              <TabsTrigger value="sell" className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4" />
                <span>Sell</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SOMI Amount</label>
                <Input
                  type="number"
                  placeholder="0.01"
                  value={sttAmount}
                  onChange={(e) => setSttAmount(e.target.value)}
                  disabled={isTrading || isConfirming}
                />
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span>You will receive:</span>
                  <span className="font-medium">
                    ~{sttAmount ? (parseFloat(sttAmount) / parseFloat(price)).toFixed(2) : "0"} {tokenInfo.symbol}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleBuy}
                  disabled={!sttAmount || isTrading || isConfirming || !address}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isTrading || isConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isConfirming ? "Confirming..." : "Buying..."}
                    </>
                  ) : (
                    `Buy ${tokenInfo.symbol}`
                  )}
                </Button>
                
                {(isTrading || isConfirming) && (
                  <Button
                    onClick={() => {
                      setIsTrading(false);
                      setTxHash("");
                      toast({
                        title: "Transaction Cancelled",
                        description: "You can try again",
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Token Amount</label>
                  <button 
                    className="text-xs text-primary hover:underline"
                    onClick={() => setTokenAmount(tokenBalance)}
                  >
                    Max: {parseFloat(tokenBalance).toFixed(2)} {tokenInfo.symbol}
                  </button>
                </div>
                <Input
                  type="number"
                  placeholder="100"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  disabled={isTrading || isConfirming}
                />
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span>You will receive:</span>
                  <span className="font-medium">
                    ~{tokenAmount ? (parseFloat(tokenAmount) * parseFloat(price)).toFixed(6) : "0"} SOMI
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleSell}
                  disabled={!tokenAmount || isTrading || isConfirming || !address || parseFloat(tokenBalance) === 0}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isTrading || isConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isConfirming ? "Confirming..." : "Selling..."}
                    </>
                  ) : (
                    `Sell ${tokenInfo.symbol}`
                  )}
                </Button>

                {(isTrading || isConfirming) && (
                  <Button
                    onClick={() => {
                      setIsTrading(false);
                      setTxHash("");
                      setNeedsApproval(false);
                      toast({
                        title: "Transaction Cancelled",
                        description: "You can try again",
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="text-center text-xs text-muted-foreground">
          <p>Platform Fee: 1% | Creator Fee: 1%</p>
        </div>
      </CardContent>
      
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setSuccessData(null);
          setTimeout(() => {
            refetchAllowance();
            refetchTokenInfo();
          }, 1000);
        }}
        title={successData?.title || ""}
        message={successData?.message || ""}
        txHash={successData?.txHash}
        tokenInfo={successData?.tokenInfo}
        type={successData?.type || "buy"}
      />
    </Card>
  );
}