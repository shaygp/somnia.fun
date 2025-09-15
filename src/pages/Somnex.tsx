import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowDownUp, TrendingUp, Activity, DollarSign, Rocket, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { useAccount } from "wagmi";
import { useSomnexSwap } from "@/hooks/useSomnex";
import { useAllTokens, useTokenInfo } from "@/hooks/usePumpFun";
import { CONTRACT_ADDRESSES, UNISWAP_V2_ROUTER_ABI, MEME_TOKEN_ABI } from "@/config/contracts";
import { useWriteContract } from "wagmi";
import { parseEther } from "viem";
import AnimatedBackground from "@/components/AnimatedBackground";

const Somnex = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [fromToken, setFromToken] = useState("STT");
  const [toToken, setToToken] = useState("USDT");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [isSwapping, setIsSwapping] = useState(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [tokenAAmount, setTokenAAmount] = useState("");
  const [tokenBAmount, setTokenBAmount] = useState("");
  const [selectedTokenA, setSelectedTokenA] = useState("STT");
  const [selectedTokenB, setSelectedTokenB] = useState("WSTT");
  const { executeSwap, getQuote } = useSomnexSwap();
  const { tokens } = useAllTokens();
  const { writeContractAsync } = useWriteContract();

  const graduatedTokens = tokens?.filter(tokenAddress => {
    const { tokenInfo } = useTokenInfo(tokenAddress);
    return tokenInfo?.graduatedToDeX;
  }) || [];

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      const quote = getQuote(fromToken, toToken, fromAmount);
      setToAmount(quote);
    }
  }, [fromAmount, fromToken, toToken]);

  const TOKEN_ADDRESSES: { [key: string]: string } = {
    STT: "0x0000000000000000000000000000000000000000",
    WSTT: CONTRACT_ADDRESSES.WSTT,
    USDT: "0x0000000000000000000000000000000000000001",
  };

  const handleSwap = async () => {
    if (!isConnected || !fromAmount || isSwapping) return;

    setIsSwapping(true);
    try {
      const fromAddress = TOKEN_ADDRESSES[fromToken] || fromToken;
      const toAddress = TOKEN_ADDRESSES[toToken] || toToken;

      toast({
        title: "Swap Initiated",
        description: "Processing swap transaction...",
      });

      const hash = await executeSwap(fromAddress, toAddress, fromAmount, slippage);

      if (hash) {
        toast({
          title: "Swap Successful",
          description: `Transaction hash: ${hash.slice(0, 10)}...`,
        });
        setFromAmount("");
        setToAmount("");
      }
    } catch (error) {
      console.error("Swap failed:", error);
      toast({
        title: "Swap Failed",
        description: "Transaction was rejected or failed",
        variant: "destructive"
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!isConnected || !tokenAAmount || !tokenBAmount || isAddingLiquidity) return;

    setIsAddingLiquidity(true);
    try {
      const tokenAAddress = TOKEN_ADDRESSES[selectedTokenA] || selectedTokenA;
      const tokenBAddress = TOKEN_ADDRESSES[selectedTokenB] || selectedTokenB;
      const amountADesired = parseEther(tokenAAmount);
      const amountBDesired = parseEther(tokenBAmount);
      const amountAMin = parseEther((parseFloat(tokenAAmount) * 0.95).toString());
      const amountBMin = parseEther((parseFloat(tokenBAmount) * 0.95).toString());
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      toast({
        title: "Adding Liquidity",
        description: "Processing liquidity transaction...",
      });

      if (selectedTokenA !== "STT") {
        await writeContractAsync({
          address: tokenAAddress as `0x${string}`,
          abi: MEME_TOKEN_ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.SOMNEX_ROUTER, amountADesired],
        });
      }

      if (selectedTokenB !== "STT") {
        await writeContractAsync({
          address: tokenBAddress as `0x${string}`,
          abi: MEME_TOKEN_ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.SOMNEX_ROUTER, amountBDesired],
        });
      }

      await new Promise(resolve => setTimeout(resolve, 3000));

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.SOMNEX_ROUTER as `0x${string}`,
        abi: UNISWAP_V2_ROUTER_ABI,
        functionName: 'addLiquidity',
        args: [tokenAAddress, tokenBAddress, amountADesired, amountBDesired, amountAMin, amountBMin, address, deadline],
      });

      if (hash) {
        toast({
          title: "Liquidity Added",
          description: `Transaction hash: ${hash.slice(0, 10)}...`,
        });
        setTokenAAmount("");
        setTokenBAmount("");
      }
    } catch (error) {
      console.error("Add liquidity failed:", error);
      toast({
        title: "Failed to Add Liquidity",
        description: "Transaction was rejected or failed",
        variant: "destructive"
      });
    } finally {
      setIsAddingLiquidity(false);
    }
  };

  return (
    <div className="min-h-screen bg-somnia-bg relative">
      <AnimatedBackground />
      <Header />
      <div className="flex relative z-10">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <img src="/somnex-logo.svg" alt="Somnex" className="w-10 h-10" />
                <h1 className="text-3xl font-bold text-primary">Somnex DEX</h1>
              </div>
              <p className="text-muted-foreground">Trade graduated tokens on Somnia's native DEX</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4 bg-somnia-card border-somnia-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">24h Volume</p>
                    <p className="text-2xl font-bold text-primary">$2.4M</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary opacity-50" />
                </div>
              </Card>
              <Card className="p-4 bg-somnia-card border-somnia-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total TVL</p>
                    <p className="text-2xl font-bold text-primary">$12.8M</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </Card>
              <Card className="p-4 bg-somnia-card border-somnia-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Graduated Tokens</p>
                    <p className="text-2xl font-bold text-primary">{graduatedTokens.length}</p>
                  </div>
                  <Rocket className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </Card>
              <Card className="p-4 bg-somnia-card border-somnia-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Pairs</p>
                    <p className="text-2xl font-bold text-primary">256</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-500 opacity-50" />
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card className="p-6 bg-somnia-card border-somnia-border">
                  <Tabs defaultValue="swap" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-somnia-bg">
                      <TabsTrigger value="swap">Swap</TabsTrigger>
                      <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
                      <TabsTrigger value="pools">Pools</TabsTrigger>
                    </TabsList>

                    <TabsContent value="swap" className="space-y-4">
                      <div className="space-y-2">
                        <Label>From</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="0.0"
                            value={fromAmount}
                            onChange={(e) => setFromAmount(e.target.value)}
                            className="flex-1 bg-somnia-bg border-somnia-border"
                          />
                          <select
                            value={fromToken}
                            onChange={(e) => setFromToken(e.target.value)}
                            className="px-4 py-2 bg-somnia-bg border border-somnia-border rounded-md text-primary"
                          >
                            <option value="STT">STT</option>
                            <option value="WSTT">WSTT</option>
                            <option value="USDT">USDT</option>
                            {graduatedTokens.map(token => (
                              <option key={token} value={token}>
                                {token.slice(0, 6)}...
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSwapTokens}
                          className="rounded-full hover:bg-somnia-hover"
                        >
                          <ArrowDownUp className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>To</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="0.0"
                            value={toAmount}
                            readOnly
                            className="flex-1 bg-somnia-bg border-somnia-border"
                          />
                          <select
                            value={toToken}
                            onChange={(e) => setToToken(e.target.value)}
                            className="px-4 py-2 bg-somnia-bg border border-somnia-border rounded-md text-primary"
                          >
                            <option value="USDT">USDT</option>
                            <option value="STT">STT</option>
                            <option value="WSTT">WSTT</option>
                            {graduatedTokens.map(token => (
                              <option key={token} value={token}>
                                {token.slice(0, 6)}...
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Slippage Tolerance</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={slippage === "0.1" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSlippage("0.1")}
                            className={slippage === "0.1" ? "bg-primary" : ""}
                          >
                            0.1%
                          </Button>
                          <Button
                            variant={slippage === "0.5" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSlippage("0.5")}
                            className={slippage === "0.5" ? "bg-primary" : ""}
                          >
                            0.5%
                          </Button>
                          <Button
                            variant={slippage === "1" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSlippage("1")}
                            className={slippage === "1" ? "bg-primary" : ""}
                          >
                            1%
                          </Button>
                          <Input
                            type="number"
                            placeholder="Custom"
                            value={slippage}
                            onChange={(e) => setSlippage(e.target.value)}
                            className="w-24 bg-somnia-bg border-somnia-border"
                          />
                        </div>
                      </div>

                      <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={!isConnected || !fromAmount || isSwapping}
                        onClick={handleSwap}
                      >
                        {!isConnected ? "Connect Wallet" : isSwapping ? "Swapping..." : "Swap"}
                      </Button>

                      <div className="text-center text-xs text-muted-foreground">
                        <p>Platform Fee: 0.3% | Min Slippage: 0.1%</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="liquidity" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Token A</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="0.0"
                            value={tokenAAmount}
                            onChange={(e) => setTokenAAmount(e.target.value)}
                            className="flex-1 bg-somnia-bg border-somnia-border"
                          />
                          <select
                            value={selectedTokenA}
                            onChange={(e) => setSelectedTokenA(e.target.value)}
                            className="px-4 py-2 bg-somnia-bg border border-somnia-border rounded-md text-primary"
                          >
                            <option value="STT">STT</option>
                            <option value="WSTT">WSTT</option>
                            <option value="USDT">USDT</option>
                            {graduatedTokens.map(token => (
                              <option key={token} value={token}>
                                {token.slice(0, 6)}...
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Token B</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="0.0"
                            value={tokenBAmount}
                            onChange={(e) => setTokenBAmount(e.target.value)}
                            className="flex-1 bg-somnia-bg border-somnia-border"
                          />
                          <select
                            value={selectedTokenB}
                            onChange={(e) => setSelectedTokenB(e.target.value)}
                            className="px-4 py-2 bg-somnia-bg border border-somnia-border rounded-md text-primary"
                          >
                            <option value="WSTT">WSTT</option>
                            <option value="STT">STT</option>
                            <option value="USDT">USDT</option>
                            {graduatedTokens.map(token => (
                              <option key={token} value={token}>
                                {token.slice(0, 6)}...
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="p-3 bg-somnia-bg rounded-lg space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Share of Pool</span>
                          <span>0.00%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Minimum {selectedTokenA} Deposited</span>
                          <span>{(parseFloat(tokenAAmount || "0") * 0.95).toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Minimum {selectedTokenB} Deposited</span>
                          <span>{(parseFloat(tokenBAmount || "0") * 0.95).toFixed(6)}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={!isConnected || !tokenAAmount || !tokenBAmount || isAddingLiquidity}
                        onClick={handleAddLiquidity}
                      >
                        {!isConnected ? "Connect Wallet" : isAddingLiquidity ? "Adding Liquidity..." : "Add Liquidity"}
                      </Button>

                      <div className="text-center text-xs text-muted-foreground">
                        <p>Earn 0.25% of all trades on this pair</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="pools" className="space-y-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-4 bg-somnia-bg rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <div className="font-medium">STT / WSTT</div>
                                <Badge variant="secondary" className="text-xs">0.3%</Badge>
                              </div>
                              <div className="text-sm text-green-500">24.5% APR</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">TVL</div>
                                <div className="font-medium">$1.8M</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">24h Volume</div>
                                <div className="font-medium">$320K</div>
                              </div>
                            </div>
                            <Button size="sm" className="w-full mt-3 bg-primary hover:bg-primary/90">
                              Add Liquidity
                            </Button>
                          </div>

                          <div className="p-4 bg-somnia-bg rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <div className="font-medium">STT / USDT</div>
                                <Badge variant="secondary" className="text-xs">0.3%</Badge>
                              </div>
                              <div className="text-sm text-green-500">18.2% APR</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">TVL</div>
                                <div className="font-medium">$2.4M</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">24h Volume</div>
                                <div className="font-medium">$450K</div>
                              </div>
                            </div>
                            <Button size="sm" className="w-full mt-3 bg-primary hover:bg-primary/90">
                              Add Liquidity
                            </Button>
                          </div>

                          {graduatedTokens.slice(0, 3).map(tokenAddress => {
                            const { tokenInfo } = useTokenInfo(tokenAddress);
                            if (!tokenInfo) return null;

                            return (
                              <div key={tokenAddress} className="p-4 bg-somnia-bg rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium">{tokenInfo.symbol} / STT</div>
                                    <Badge variant="secondary" className="text-xs">0.3%</Badge>
                                  </div>
                                  <div className="text-sm text-green-500">15.8% APR</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-muted-foreground">TVL</div>
                                    <div className="font-medium">$125K</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground">24h Volume</div>
                                    <div className="font-medium">$45K</div>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  className="w-full mt-3 bg-primary hover:bg-primary/90"
                                  onClick={() => {
                                    setSelectedTokenA(tokenInfo.symbol);
                                    setSelectedTokenB("STT");
                                  }}
                                >
                                  Add Liquidity
                                </Button>
                              </div>
                            );
                          })}
                        </div>

                        {graduatedTokens.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No graduated tokens yet</p>
                            <p className="text-sm text-muted-foreground">
                              Pools will appear here when tokens graduate from the bonding curve
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card className="p-6 bg-somnia-card border-somnia-border h-full">
                  <h2 className="text-xl font-bold mb-4">Graduated Tokens</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                      {graduatedTokens.length > 0 ? (
                        graduatedTokens.slice(0, 10).map(tokenAddress => {
                          const { tokenInfo } = useTokenInfo(tokenAddress);
                          if (!tokenInfo) return null;

                          return (
                            <div key={tokenAddress} className="p-4 bg-somnia-bg rounded-lg hover:bg-somnia-hover transition-colors">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={tokenInfo.imageUri || "https://via.placeholder.com/40"}
                                    alt={tokenInfo.name}
                                    className="w-10 h-10 rounded-full"
                                  />
                                  <div>
                                    <div className="font-medium">{tokenInfo.name}</div>
                                    <div className="text-sm text-muted-foreground">${tokenInfo.symbol}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/50">
                                    Graduated
                                  </Badge>
                                  <Button size="sm" variant="ghost" className="hover:bg-somnia-hover">
                                    <ArrowRight className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-3 flex justify-between text-sm">
                                <span className="text-muted-foreground">Liquidity: {tokenInfo.sttRaised} STT</span>
                                <span className="text-muted-foreground">Holders: 1,234</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No graduated tokens yet</p>
                          <p className="text-sm mt-2">Tokens graduate to Somnex DEX after raising 1000 STT</p>
                        </div>
                      )}
                    </div>

                    {graduatedTokens.length === 0 && (
                      <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2 text-primary">How Graduation Works</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="text-primary">1.</span>
                            Tokens start on the bonding curve
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary">2.</span>
                            After raising 1000 STT, they graduate to Somnex DEX
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary">3.</span>
                            36 STT is locked permanently as liquidity
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary">4.</span>
                            Trading continues on Somnex with full DEX features
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Somnex;