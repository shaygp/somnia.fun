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
  showChart?: boolean;
  graduatedToDeX: boolean;
  sttRaised: string;
}

const TokenItem = ({ tokenAddress }: { tokenAddress: string }) => {
  const { tokenInfo, isLoading: tokenInfoLoading, error: tokenInfoError } = useTokenInfo(tokenAddress);
  const { price, isLoading: priceLoading, error: priceError } = useTokenPrice(tokenAddress);

  const isDemoToken = tokenAddress === '0x1234567890123456789012345678901234567890';

  console.log('TokenItem - tokenAddress:', tokenAddress, 'tokenInfo:', tokenInfo, 'error:', tokenInfoError);

  const demoTokenInfo = {
    name: "Somnia Cat",
    symbol: "SOMCAT",
    imageUri: "/catlayer.svg",
    description: "The purrfect meme token for Somnia! Join the cat revolution on the blockchain.",
    sttRaised: "12.5",
    tokensSold: "2500000",
    graduatedToDeX: false
  };

  // Handle errors for real tokens
  if (!isDemoToken && tokenInfoError) {
    console.error('TokenItem error for', tokenAddress, tokenInfoError);
    return (
      <div className="p-4 border border-red-500/20 rounded-lg bg-red-500/5">
        <p className="text-red-500 text-sm">Failed to load token: {tokenAddress.slice(0, 8)}...</p>
        <p className="text-xs text-muted-foreground mt-1">{tokenInfoError.message}</p>
      </div>
    );
  }

  // Handle loading state for real tokens
  if (!isDemoToken && tokenInfoLoading) {
    return (
      <div className="p-4 border border-somnia-border rounded-lg bg-somnia-card animate-pulse">
        <div className="h-4 bg-gray-600 rounded mb-2"></div>
        <div className="h-3 bg-gray-700 rounded"></div>
      </div>
    );
  }

  const displayTokenInfo = isDemoToken ? demoTokenInfo : tokenInfo;
  const displayPrice = isDemoToken ? "0.000005" : price;
  
  // Don't render if we don't have token info for real tokens
  if (!isDemoToken && !displayTokenInfo) {
    console.log('TokenItem - no tokenInfo for non-demo token:', tokenAddress);
    return null;
  }

  const tokenData: TokenData = {
    address: tokenAddress,
    name: displayTokenInfo.name,
    symbol: displayTokenInfo.symbol,
    image: displayTokenInfo.imageUri || "https://via.placeholder.com/64",
    marketCap: `${(parseFloat(displayTokenInfo.sttRaised) * 50).toFixed(1)}K`,
    price: `${parseFloat(displayPrice).toFixed(8)} STT`,
    change24h: isDemoToken ? 15.7 : Math.random() * 40 - 20,
    replies: isDemoToken ? 142 : Math.floor(Math.random() * 1000),
    holders: isDemoToken ? 89 : Math.floor(Math.random() * 5000),
    description: displayTokenInfo.description || "A meme token on Somnia",
    trending: parseFloat(displayTokenInfo.sttRaised) > 10,
    liquidityPooled: (parseFloat(displayTokenInfo.sttRaised) / 80) * 100,
    showChart: true,
    graduatedToDeX: displayTokenInfo.graduatedToDeX,
    sttRaised: displayTokenInfo.sttRaised
  };

  return (
    <Link 
      to={`/token/${tokenAddress}`} 
      className="block transition-transform hover:scale-[1.02]"
    >
      <TokenCard {...tokenData} />
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

  const demoTokens = ['0x1234567890123456789012345678901234567890'];

  console.log('TokenGrid - tokens:', tokens, 'isLoading:', isLoading, 'error:', error);

  const filteredTokens = React.useMemo(() => {
    // Always show the demo token, and add real tokens if they exist
    const allTokens = tokens && tokens.length > 0 ? [...demoTokens, ...tokens] : demoTokens;
    
    console.log('TokenGrid - filteredTokens calculation:', {
      tokens,
      tokensLength: tokens?.length,
      demoTokens,
      allTokens
    });

    switch (activeTab) {
      case "trending":
        return allTokens.slice(0, 6);
      case "new":
        return allTokens.slice().reverse().slice(0, 8);
      case "graduated":
        return allTokens.slice(0, 3);
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
            all ({tokens?.length || 1})
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
              {filteredTokens.map((tokenAddress) => (
                <TokenItem key={tokenAddress} tokenAddress={tokenAddress} />
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
              {filteredTokens.map((tokenAddress) => (
                <TokenItem key={tokenAddress} tokenAddress={tokenAddress} />
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
              {filteredTokens.map((tokenAddress) => (
                <TokenItem key={tokenAddress} tokenAddress={tokenAddress} />
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
              {filteredTokens.map((tokenAddress) => (
                <TokenItem key={tokenAddress} tokenAddress={tokenAddress} />
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