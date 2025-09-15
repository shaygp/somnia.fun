import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Wallet, Plus, ExternalLink, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import StatsCards from "@/components/StatsCards";
import { useAccount } from 'wagmi';
import { useAllTokens, useTokenBalance, useTokenInfo, useTokenPrice } from "@/hooks/usePumpFun";
import { useState, useEffect, useCallback } from "react";
import CreateTokenModal from "@/components/CreateTokenModal";

// Define colors for tokens
const tokenColors = [
  { accent: "text-somnia-lime", bg: "bg-green-500/20", border: "border-green-500/30" },
  { accent: "text-somnia-cyan", bg: "bg-cyan-500/20", border: "border-cyan-500/30" },
  { accent: "text-somnia-purple", bg: "bg-purple-500/20", border: "border-purple-500/30" },
  { accent: "text-somnia-orange", bg: "bg-orange-500/20", border: "border-orange-500/30" },
  { accent: "text-somnia-pink", bg: "bg-pink-500/20", border: "border-pink-500/30" },
  { accent: "text-somnia-blue", bg: "bg-blue-500/20", border: "border-blue-500/30" },
];

const UserTokenItem = ({ tokenAddress, colorTheme, onValueUpdate }) => {
  const { tokenInfo } = useTokenInfo(tokenAddress);
  const { balance } = useTokenBalance(tokenAddress);
  const { price } = useTokenPrice(tokenAddress);

  const balanceNum = parseFloat(balance);
  const priceNum = parseFloat(price);
  const value = balanceNum * priceNum;

  useEffect(() => {
    if (onValueUpdate && tokenInfo && balanceNum > 0) {
      onValueUpdate(tokenAddress, value);
    }
  }, [value, tokenInfo, balanceNum, onValueUpdate, tokenAddress]);

  if (balanceNum === 0 || !tokenInfo) return null;

  return (
    <Card className={`bg-somnia-card border-somnia-border p-6 hover:shadow-somnia-glow transition-all duration-300 ${colorTheme.border} hover:${colorTheme.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-lg ${colorTheme.bg}`}>
            <img src={tokenInfo.imageUri || "/catlayer.svg"} alt={tokenInfo.name} className="w-10 h-10 rounded-lg" />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${colorTheme.accent}`}>{tokenInfo.name}</h3>
            <p className="text-sm text-muted-foreground">${tokenInfo.symbol}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-right">
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="font-semibold text-foreground">{balanceNum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Value</p>
            <p className="font-semibold text-foreground">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="font-semibold text-foreground">{parseFloat(price).toFixed(8)} STT</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" className={`border-somnia-border hover:bg-somnia-hover hover:${colorTheme.accent}`} asChild>
            <Link to={`/token/${tokenAddress}`}>Trade</Link>
          </Button>
          <ExternalLink className={`w-4 h-4 ${colorTheme.accent} hover:opacity-80 cursor-pointer`} />
        </div>
      </div>
    </Card>
  );
};

const Portfolio = () => {
  const { address } = useAccount();
  const { tokens, isLoading: tokensLoading } = useAllTokens();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const createdTokens = [
    {
      name: "My Token",
      symbol: "MYTKN",
      image: "/catlayer.svg",
      holders: 234,
      volume24h: "$5,678",
      createdDate: "2024-01-15",
      status: "Active"
    }
  ];

  const [tokenValues, setTokenValues] = useState(new Map());

  const updateTokenValue = useCallback((tokenAddress, value) => {
    setTokenValues(prev => new Map(prev.set(tokenAddress, value)));
  }, []);

  const totalValue = Array.from(tokenValues.values()).reduce((sum, value) => sum + value, 0);
  const activePositions = tokenValues.size;

  return (
    <div className="min-h-screen bg-somnia-bg text-foreground relative">
      <AnimatedBackground />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/board">
              <Button variant="outline" size="sm" className="border-somnia-border hover:bg-somnia-hover">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Board
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Portfolio</h1>
              <p className="text-muted-foreground">Manage your Somnia token positions</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Token
          </Button>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-somnia-card border-somnia-border p-6 shadow-somnia-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                <p className="text-3xl font-bold text-foreground">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <Wallet className="w-8 h-8 text-primary" />
            </div>
          </Card>
          
          <Card className="bg-somnia-card border-somnia-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-2xl font-bold text-primary`}>
                  $0.00
                </p>
              </div>
              <div className={`p-2 rounded-lg bg-primary/20`}>
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>
          
          <Card className="bg-somnia-card border-somnia-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Positions</p>
                <p className="text-2xl font-bold text-foreground">{activePositions}</p>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                Live
              </Badge>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="holdings" className="w-full">
          <TabsList className="bg-somnia-card border border-somnia-border">
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="created">Created Tokens</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="holdings" className="mt-6">
            <div className="space-y-4">
              {!address ? (
                <Card className="bg-somnia-card border-somnia-border p-12">
                  <div className="text-center">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Connect your wallet to view your holdings</p>
                  </div>
                </Card>
              ) : tokensLoading ? (
                <Card className="bg-somnia-card border-somnia-border p-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading your portfolio...</p>
                  </div>
                </Card>
              ) : tokens?.length === 0 ? (
                <Card className="bg-somnia-card border-somnia-border p-12">
                  <div className="text-center">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No tokens found</p>
                    <p className="text-sm text-muted-foreground">Create or buy some tokens to see them here</p>
                  </div>
                </Card>
              ) : (
                tokens.map((tokenAddress, index) => {
                  const colorTheme = tokenColors[index % tokenColors.length];
                  return (
                    <UserTokenItem
                      key={tokenAddress}
                      tokenAddress={tokenAddress}
                      colorTheme={colorTheme}
                      onValueUpdate={updateTokenValue}
                    />
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="created" className="mt-6">
            <div className="space-y-4">
              {createdTokens.map((token, index) => (
                <Card key={index} className="bg-somnia-card border-somnia-border p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img src={token.image} alt={token.name} className="w-12 h-12 rounded-full border-2 border-somnia-border" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{token.name}</h3>
                        <p className="text-sm text-muted-foreground">${token.symbol}</p>
                      </div>
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        Creator
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-8 text-right">
                      <div>
                        <p className="text-sm text-muted-foreground">Holders</p>
                        <p className="font-semibold text-foreground">{token.holders}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">24h Volume</p>
                        <p className="font-semibold text-foreground">{token.volume24h}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          {token.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button size="sm" variant="outline" className="border-somnia-border hover:bg-somnia-hover">
                      Manage
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="bg-somnia-card border-somnia-border p-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Transaction history coming soon...</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreateTokenModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default Portfolio;