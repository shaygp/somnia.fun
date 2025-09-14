import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpDown, TrendingUp, TrendingDown, Loader2, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePumpFun, useTokenPrice, useTokenInfo, useTokenBalance } from "@/hooks/usePumpFun";
import { useAccount, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { somniaTestnetChain } from '@/config/wagmi';
import { Badge } from "@/components/ui/badge";
import { useSomnexGraduation } from "@/hooks/useSomnex";
import { Link } from "react-router-dom";

interface TradingInterfaceProps {
  tokenAddress: string;
}

export default function TradingInterface({ tokenAddress }: TradingInterfaceProps) {
  const { toast } = useToast();
  const { address, chain } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { buyTokens, sellTokens, approveToken } = usePumpFun();
  const { tokenInfo, isLoading: tokenInfoLoading } = useTokenInfo(tokenAddress);
  const { price } = useTokenPrice(tokenAddress);
  const { balance: tokenBalance } = useTokenBalance(tokenAddress);
  const { canGraduate, sttCollected, isGraduated, graduateToken, listOnSomnex } = useSomnexGraduation(tokenAddress);
  
  const [activeTab, setActiveTab] = useState("buy");
  const [sttAmount, setSttAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [isTrading, setIsTrading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [needsApproval, setNeedsApproval] = useState(false);
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  const handleNetworkSwitch = async () => {
    try {
      await switchChain({ chainId: somniaTestnetChain.id });
      toast({
        title: "Network Switched",
        description: "Successfully switched to Somnia Testnet",
      });
    } catch (error) {
      toast({
        title: "Network Switch Failed",
        description: "Please manually switch to Somnia Testnet in your wallet",
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

    if (chain?.id !== somniaTestnetChain.id) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Somnia Testnet to trade",
        variant: "destructive"
      });
      await handleNetworkSwitch();
      return;
    }

    if (!sttAmount) return;

    setIsTrading(true);

    try {
      const hash = await buyTokens(tokenAddress, sttAmount);
      setTxHash(hash);

      toast({
        title: "Purchase Initiated",
        description: "Waiting for transaction confirmation...",
      });

    } catch (error: any) {
      console.error("Buy error:", error);
      toast({
        title: "Purchase Failed",
        description: error?.message || "Failed to buy tokens",
        variant: "destructive"
      });
      setIsTrading(false);
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

    if (chain?.id !== somniaTestnetChain.id) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Somnia Testnet to trade",
        variant: "destructive"
      });
      await handleNetworkSwitch();
      return;
    }

    if (!tokenAmount) return;

    setIsTrading(true);

    try {
      if (needsApproval) {
        const approveHash = await approveToken(tokenAddress, tokenAmount);
        setTxHash(approveHash);
        toast({
          title: "Approval Initiated",
          description: "Approving tokens for sale...",
        });
        return;
      }

      const hash = await sellTokens(tokenAddress, tokenAmount);
      setTxHash(hash);

      toast({
        title: "Sale Initiated",
        description: "Waiting for transaction confirmation...",
      });

    } catch (error: any) {
      console.error("Sell error:", error);
      toast({
        title: "Sale Failed",
        description: error?.message || "Failed to sell tokens",
        variant: "destructive"
      });
      setIsTrading(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setIsTrading(false);
      setTxHash("");
      setSttAmount("");
      setTokenAmount("");
      
      toast({
        title: "Transaction Successful!",
        description: activeTab === "buy" ? "Tokens purchased successfully" : "Tokens sold successfully",
      });
    }
  }, [isSuccess, activeTab, toast]);

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

  const progressToGraduation = tokenInfo.graduatedToDeX ?
    100 :
    (parseFloat(tokenInfo.sttRaised) / 1000) * 100;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={tokenInfo.imageUri || "https://via.placeholder.com/40"} 
              alt={tokenInfo.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-bold">{tokenInfo.name}</h3>
              <p className="text-sm text-muted-foreground">${tokenInfo.symbol}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{parseFloat(price).toFixed(8)} STT</p>
            <p className="text-xs text-muted-foreground">per token</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to Somnex DEX</span>
            <span>{tokenInfo.graduatedToDeX ? "Graduated to Somnex!" : `${tokenInfo.sttRaised}/1000 STT`}</span>
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
                This token has graduated to Somnex DEX! 36 STT locked permanently.
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

                  if (chain?.id !== somniaTestnetChain.id) {
                    toast({
                      title: "Wrong Network",
                      description: "Please switch to Somnia Testnet to graduate token",
                      variant: "destructive"
                    });
                    await handleNetworkSwitch();
                    return;
                  }

                  try {
                    await graduateToken();
                    await listOnSomnex();
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
                <label className="text-sm font-medium">STT Amount</label>
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
                    ~{tokenAmount ? (parseFloat(tokenAmount) * parseFloat(price)).toFixed(6) : "0"} STT
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleSell}
                disabled={!tokenAmount || isTrading || isConfirming || !address || parseFloat(tokenBalance) === 0}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isTrading || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isConfirming ? "Confirming..." : needsApproval ? "Approving..." : "Selling..."}
                  </>
                ) : (
                  `Sell ${tokenInfo.symbol}`
                )}
              </Button>
            </TabsContent>
          </Tabs>
        )}

        <div className="text-center text-xs text-muted-foreground">
          <p>Platform Fee: 1% | Creator Fee: 1%</p>
        </div>
      </CardContent>
    </Card>
  );
}