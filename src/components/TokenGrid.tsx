import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TokenCard from "./TokenCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, SortAsc, Loader2 } from "lucide-react";
import { useAllTokens, useTokenInfo, useTokenPrice } from "@/hooks/usePumpFun";

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  image: string;
  marketCap: string;
  price: string;
  change24h: number;
  replies: number;
  holders: number;
  description: string;
  trending: boolean;
  liquidityPooled?: number;
  tokensSold?: number;
  showChart?: boolean;
  graduatedToDeX: boolean;
  sttRaised: string;
}

const TokenItem = ({ tokenData }: { tokenData: any }) => {
  const { price } = useTokenPrice(tokenData.address);

  const calculatedPrice = price && parseFloat(price) > 0
    ? parseFloat(price)
    : parseFloat(tokenData.tokensSold) > 0
      ? parseFloat(tokenData.somiRaised) / parseFloat(tokenData.tokensSold)
      : 0.00000001;

  const cardData: TokenData = {
    address: tokenData.address,
    name: tokenData.name,
    symbol: tokenData.symbol,
    image: tokenData.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${tokenData.address}`,
    marketCap: `${tokenData.somiRaised} SOMI`,
    price: `${calculatedPrice.toFixed(8)} SOMI`,
    change24h: 0,
    replies: 0,
    holders: 0,
    description: tokenData.description || "just pure internet chaos",
    trending: parseFloat(tokenData.somiRaised) > 100,
    liquidityPooled: parseFloat(tokenData.somiRaised),
    tokensSold: parseFloat(tokenData.tokensSold),
    showChart: true,
    graduatedToDeX: tokenData.graduated,
    sttRaised: tokenData.somiRaised
  };

  return (
    <Link
      to={`/token/${tokenData.address}`}
      className="block transition-transform hover:scale-[1.02]"
    >
      <TokenCard {...cardData} />
    </Link>
  );
};

interface TokenGridProps {
  filter?: string | null;
}

const TokenGrid = ({ filter }: TokenGridProps) => {
  const [activeTab, setActiveTab] = useState(filter || "all");
  const { tokens, isLoading, error, refetch } = useAllTokens();

  React.useEffect(() => {
    if (filter) {
      switch (filter) {
        case "trending":
          setActiveTab("trending");
          break;
        case "recent":
          setActiveTab("new");
          break;
        case "favorites":
          setActiveTab("all");
          break;
        default:
          setActiveTab("all");
          break;
      }
    }
  }, [filter]);

  console.log('TokenGrid - tokens:', tokens, 'isLoading:', isLoading, 'error:', error);

  const filteredTokens = React.useMemo(() => {
    const allTokens = tokens || [];

    console.log('TokenGrid - filteredTokens calculation:', {
      tokens,
      tokensLength: tokens?.length,
      allTokens
    });

    switch (activeTab) {
      case "trending":
        return allTokens.filter((t: any) => parseFloat(t.somiRaised) > 0.5).slice(0, 6);
      case "new":
        return allTokens.slice().reverse().slice(0, 8);
      case "graduated":
        return allTokens.filter((t: any) => t.graduated).slice(0, 3);
      default:
        return allTokens;
    }
  }, [tokens, activeTab]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6 relative scan-lines">
        <div className="flex items-center justify-center py-12 border border-somnia-border rounded bg-somnia-card">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading tokens from blockchain...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 relative scan-lines">
        <div className="text-center py-12 border border-somnia-border rounded bg-somnia-card">
          <p className="text-red-500 mb-4">Error loading tokens: {error.message}</p>
          <p className="text-muted-foreground text-sm mb-4">
            Make sure you're connected to Somnia Testnet and the contracts are deployed.
          </p>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="border-somnia-border hover:bg-somnia-hover"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative scan-lines">
      {/* Terminal Header */}
      <div className="flex items-center justify-between border border-somnia-border rounded bg-somnia-card p-4">
        <div className="flex items-center space-x-3">
          <span className="text-primary">$</span>
          <div>
            <h1 className="text-lg font-medium text-primary">~/somnia.fun/tokens</h1>
            <p className="text-sm text-muted-foreground">ls -la --sort=market_cap --filter=active</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
            <Button variant="outline" className="border-somnia-border hover:bg-somnia-hover">
              <Filter className="w-4 h-4 mr-2" />
              --filter
            </Button>
            <Button variant="outline" className="border-somnia-border hover:bg-somnia-hover">
              <SortAsc className="w-4 h-4 mr-2" />
              --sort
            </Button>
        </div>
      </div>

      {/* Terminal Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-somnia-card border border-somnia-border">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            all ({tokens?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="trending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            trending
          </TabsTrigger>
          <TabsTrigger value="new" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            new
          </TabsTrigger>
          <TabsTrigger value="graduated" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            graduated
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {filteredTokens.length === 0 ? (
            <div className="text-center py-12 border border-somnia-border rounded bg-somnia-card">
              <p className="text-muted-foreground"># No tokens found. Create the first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTokens.map((token: any) => (
                <TokenItem key={token.address} tokenData={token} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          {filteredTokens.length === 0 ? (
            <div className="text-center py-12 border border-somnia-border rounded bg-somnia-card">
              <p className="text-muted-foreground"># No trending tokens yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTokens.map((token: any) => (
                <TokenItem key={token.address} tokenData={token} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          {filteredTokens.length === 0 ? (
            <div className="text-center py-12 border border-somnia-border rounded bg-somnia-card">
              <p className="text-muted-foreground"># No new tokens yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTokens.map((token: any) => (
                <TokenItem key={token.address} tokenData={token} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="graduated" className="mt-6">
          {filteredTokens.length === 0 ? (
            <div className="text-center py-12 border border-somnia-border rounded bg-somnia-card">
              <p className="text-muted-foreground"># No graduated tokens yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTokens.map((token: any) => (
                <TokenItem key={token.address} tokenData={token} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Load More Button */}
      <div className="text-center pt-8">
        <Button variant="outline" className="border-somnia-border hover:bg-somnia-hover">
          ./load_more.sh --count=20
        </Button>
      </div>
    </div>
  );
};

export default TokenGrid;