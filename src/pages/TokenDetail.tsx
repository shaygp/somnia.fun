import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BondingCurveChart from "@/components/BondingCurveChart";
import TradingInterface from "@/components/TradingInterface";
import ActivityFeed from "@/components/ActivityFeed";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useTokenInfo, useTokenPrice } from "@/hooks/usePumpFun";
import { Loader2 } from "lucide-react";

const TokenDetail = () => {
  const { tokenAddress } = useParams();
  const navigate = useNavigate();
  const { tokenInfo, isLoading: tokenInfoLoading } = useTokenInfo(tokenAddress || "");
  const { price, isLoading: priceLoading } = useTokenPrice(tokenAddress || "");
  
  const isDemoToken = tokenAddress === '0x1234567890123456789012345678901234567890';
  
  const demoTokenInfo = {
    name: "Somnia Cat",
    symbol: "SOMCAT",
    imageUri: "/catlayer.svg",
    description: "The purrfect meme token for Somnia! Join the cat revolution on the blockchain. This token represents all the cats who believe in decentralized finance and want to take over the world one purr at a time.",
    sttRaised: "12.5",
    tokensSold: "2500000",
    totalSupply: "1000000000",
    creator: "0xCaF3CaF3CaF3CaF3CaF3CaF3CaF3CaF3CaF3CaF3",
    createdAt: "1704096000",
    graduatedToDeX: false,
    tokenAddress: tokenAddress || ""
  };
  
  const displayTokenInfo = isDemoToken ? demoTokenInfo : tokenInfo;
  const displayPrice = isDemoToken ? "0.000005" : price;
  
  if (!tokenAddress) {
    return <div>Token not found</div>;
  }

  if (!isDemoToken && (tokenInfoLoading || priceLoading)) {
    return (
      <div className="min-h-screen bg-somnia-bg text-foreground relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex items-center space-x-2 relative z-10">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading token data...</span>
        </div>
      </div>
    );
  }

  if (!isDemoToken && !tokenInfo) {
    return (
      <div className="min-h-screen bg-somnia-bg text-foreground relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10">
          <p>Token not found</p>
          <Button onClick={() => navigate('/board')} className="mt-4">
            Back to Board
          </Button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/board');
  };

  return (
    <div className="min-h-screen bg-somnia-bg text-foreground relative">
      <AnimatedBackground />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="border-somnia-border hover:bg-somnia-hover" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Board
            </Button>
            
            <div className="flex items-center space-x-3">
              <img src={displayTokenInfo.imageUri || "https://via.placeholder.com/48"} alt={displayTokenInfo.name} className="w-12 h-12 rounded-full border-2 border-somnia-border" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{displayTokenInfo.name}</h1>
                <p className="text-muted-foreground">${displayTokenInfo.symbol}</p>
              </div>
              {displayTokenInfo.graduatedToDeX && (
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  Graduated
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="border-somnia-border hover:bg-somnia-hover">
              <Star className="w-4 h-4 mr-2" />
              Add to Favorites
            </Button>
            <Button variant="outline" size="sm" className="border-somnia-border hover:bg-somnia-hover">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-somnia-card border-somnia-border p-4">
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-xl font-bold text-foreground">{parseFloat(displayPrice).toFixed(8)} STT</p>
            <p className="text-sm text-muted-foreground">per token</p>
          </Card>
          
          <Card className="bg-somnia-card border-somnia-border p-4">
            <p className="text-sm text-muted-foreground">Total Supply</p>
            <p className="text-xl font-bold text-foreground">{parseFloat(displayTokenInfo.totalSupply).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{displayTokenInfo.symbol}</p>
          </Card>
          
          <Card className="bg-somnia-card border-somnia-border p-4">
            <p className="text-sm text-muted-foreground">STT Raised</p>
            <p className="text-xl font-bold text-foreground">{parseFloat(displayTokenInfo.sttRaised).toFixed(2)} STT</p>
            <p className="text-sm text-muted-foreground">{displayTokenInfo.graduatedToDeX ? "Graduated" : "/ 1000 STT"}</p>
          </Card>
          
          <Card className="bg-somnia-card border-somnia-border p-4">
            <p className="text-sm text-muted-foreground">Tokens Sold</p>
            <p className="text-xl font-bold text-foreground">{parseFloat(displayTokenInfo.tokensSold).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{displayTokenInfo.symbol}</p>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Chart and Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bonding Curve Chart */}
            <BondingCurveChart
              tokenSymbol={displayTokenInfo.symbol}
              currentSupply={parseFloat(displayTokenInfo.tokensSold)}
              currentPrice={parseFloat(displayPrice)}
              liquidityPooled={displayTokenInfo.graduatedToDeX}
            />

            {/* Token Information */}
            <Card className="bg-somnia-card border-somnia-border p-6">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="bg-somnia-hover">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="tokenomics">Tokenomics</TabsTrigger>
                  <TabsTrigger value="community">Community</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">About {displayTokenInfo.name}</h3>
                    <p className="text-muted-foreground leading-relaxed">{displayTokenInfo.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Contract Address</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm font-mono text-foreground">{tokenAddress.slice(0, 20)}...</p>
                        <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Network</p>
                      <p className="text-sm text-foreground mt-1">Somnia Network</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Creator</p>
                      <p className="text-sm font-mono text-foreground">{displayTokenInfo.creator.slice(0, 20)}...</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created At</p>
                      <p className="text-sm text-foreground">Sun 14 Sept</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tokenomics" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Token Economics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-somnia-hover rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Supply</p>
                        <p className="text-lg font-semibold text-foreground">{parseFloat(displayTokenInfo.totalSupply).toLocaleString()}</p>
                      </div>
                      <div className="bg-somnia-hover rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Tokens Sold</p>
                        <p className="text-lg font-semibold text-foreground">{parseFloat(displayTokenInfo.tokensSold).toLocaleString()}</p>
                      </div>
                      <div className="bg-somnia-hover rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">STT Raised</p>
                        <p className="text-lg font-semibold text-foreground">{parseFloat(displayTokenInfo.sttRaised).toFixed(4)} STT</p>
                      </div>
                      <div className="bg-somnia-hover rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="text-lg font-semibold text-foreground">{displayTokenInfo.graduatedToDeX ? "Graduated to DEX" : "Bonding Curve"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="community" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Community</h3>
                    <p className="text-muted-foreground">Join the {displayTokenInfo.name} community and start trading on Somnia.</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Contract:</span>
                      <a 
                        href={`https://explorer.somnia.network/address/${tokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View on OKLink Explorer
                      </a>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Trading and Activity */}
          <div className="space-y-8">
            {/* Trading Interface */}
            <TradingInterface tokenAddress={tokenAddress} />

            {/* Activity Feed */}
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDetail;