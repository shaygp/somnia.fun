import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Wallet, Plus, ExternalLink, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import StatsCards from "@/components/StatsCards";
import { useAccount } from 'wagmi';
import { useAllTokens, useTokenBalance } from "@/hooks/usePumpFun";

// Define colors for tokens
const tokenColors = [
  { accent: "text-somnia-lime", bg: "bg-green-500/20", border: "border-green-500/30" },
  { accent: "text-somnia-cyan", bg: "bg-cyan-500/20", border: "border-cyan-500/30" },
  { accent: "text-somnia-purple", bg: "bg-purple-500/20", border: "border-purple-500/30" },
  { accent: "text-somnia-orange", bg: "bg-orange-500/20", border: "border-orange-500/30" },
  { accent: "text-somnia-pink", bg: "bg-pink-500/20", border: "border-pink-500/30" },
  { accent: "text-somnia-blue", bg: "bg-blue-500/20", border: "border-blue-500/30" },
];

const Portfolio = () => {
  const portfolioTokens = [
    {
      name: "Pepe Coin",
      symbol: "PEPE",
      image: "/catlayer.svg",
      balance: "1,250,000",
      value: "$2,847.50",
      change24h: 15.6,
      invested: "$2,200.00",
      pnl: "$647.50"
    },
    {
      name: "Layer Dog",
      symbol: "LDOG",
      image: "/catlayer.svg",
      balance: "500,000",
      value: "$1,234.75",
      change24h: -3.2,
      invested: "$1,400.00",
      pnl: "-$165.25"
    },
    {
      name: "Moon Shot",
      symbol: "MOON",
      image: "/catlayer.svg",
      balance: "75,000",
      value: "$892.15",
      change24h: 8.9,
      invested: "$750.00",
      pnl: "$142.15"
    }
  ];

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

  const totalValue = portfolioTokens.reduce((sum, token) => sum + parseFloat(token.value.replace('$', '').replace(',', '')), 0);
  const totalPnL = portfolioTokens.reduce((sum, token) => sum + parseFloat(token.pnl.replace('$', '').replace(',', '')), 0);

  return (
    <div className="min-h-screen bg-somnia-bg text-foreground relative">
      <AnimatedBackground />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline" size="sm" className="border-somnia-border hover:bg-somnia-hover">
              <Link to="/board">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Board
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Portfolio</h1>
              <p className="text-muted-foreground">Manage your Somnia token positions</p>
            </div>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
                <p className="text-3xl font-bold text-foreground">$0</p>
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
                <p className="text-2xl font-bold text-foreground">0</p>
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
              {portfolioTokens.map((token, index) => {
                const colorTheme = tokenColors[index % tokenColors.length];
                return (
                  <Card key={index} className={`bg-somnia-card border-somnia-border p-6 hover:shadow-somnia-glow transition-all duration-300 ${colorTheme.border} hover:${colorTheme.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${colorTheme.bg}`}>
                          <img src={token.image} alt={token.name} className="w-10 h-10 rounded-lg" />
                        </div>
                        <div>
                          <h3 className={`text-lg font-semibold ${colorTheme.accent}`}>{token.name}</h3>
                          <p className="text-sm text-muted-foreground">${token.symbol}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-right">
                        <div>
                          <p className="text-sm text-muted-foreground">Balance</p>
                          <p className="font-semibold text-foreground">{token.balance}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Value</p>
                          <p className="font-semibold text-foreground">{token.value}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">24h Change</p>
                          <p className={`font-semibold ${token.change24h >= 0 ? colorTheme.accent : 'text-destructive'}`}>
                            {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">P&L</p>
                          <p className={`font-semibold ${parseFloat(token.pnl.replace('$', '')) >= 0 ? colorTheme.accent : 'text-destructive'}`}>
                            {token.pnl}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" className={`border-somnia-border hover:bg-somnia-hover hover:${colorTheme.accent}`}>
                          Trade
                        </Button>
                        <ExternalLink className={`w-4 h-4 ${colorTheme.accent} hover:opacity-80 cursor-pointer`} />
                      </div>
                    </div>
                  </Card>
                );
              })}
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
    </div>
  );
};

export default Portfolio;