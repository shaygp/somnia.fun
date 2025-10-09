import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Star, ExternalLink } from "lucide-react";
import { TelegramIcon, DiscordIcon, TwitterIcon } from "@/components/icons/SocialIcons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BondingCurveChart from "@/components/BondingCurveChart";
import DetailedBondingCurve from "@/components/DetailedBondingCurve";
import TradingInterface from "@/components/TradingInterface";
import ActivityFeed from "@/components/ActivityFeed";
import TokenChat from "@/components/TokenChat";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useTokenPrice } from "@/hooks/usePumpFun";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { parseSocialLinksFromDescription } from "@/utils/socialLinks";
import { formatPrice } from "@/utils/formatters";

const TokenDetail = () => {
  const { tokenAddress } = useParams();
  const navigate = useNavigate();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [tokenInfoLoading, setTokenInfoLoading] = useState(true);
  const [tokenInfoError, setTokenInfoError] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { price, isLoading: priceLoading, error: priceError } = useTokenPrice(tokenAddress || "");

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(tokenAddress));
  }, [tokenAddress]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isFavorite) {
      const newFavorites = favorites.filter((addr: string) => addr !== tokenAddress);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      favorites.push(tokenAddress);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      setIsFavorite(true);
    }
  };

  useEffect(() => {
    const fetchToken = async () => {
      if (!tokenAddress) return;

      try {
        setTokenInfoLoading(true);
        const response = await fetch('https://tradesomnia.fun/api/tokens');
        const data = await response.json();

        if (data.success && data.tokens) {
          const token = data.tokens.find((t: any) =>
            t.address.toLowerCase() === tokenAddress.toLowerCase()
          );

          if (token) {
            setTokenInfo({
              name: token.name,
              symbol: token.symbol,
              imageUri: token.logo,
              description: token.description,
              creator: token.creator,
              createdAt: token.createdAt,
              totalSupply: token.totalSupply,
              active: token.active,
              sttRaised: token.somiRaised,
              tokensSold: token.tokensSold,
              graduatedToDeX: token.graduated,
            });
          } else {
            setTokenInfoError(new Error('Token not found'));
          }
        }
      } catch (error) {
        setTokenInfoError(error);
      } finally {
        setTokenInfoLoading(false);
      }
    };

    fetchToken();
  }, [tokenAddress]);

  const displayTokenInfo = tokenInfo;
  const displayPrice = price && price !== "0" ? price : "0.000001";
  
  // Parse social links from description
  const { cleanDescription, socialLinks } = useMemo(() => {
    if (!displayTokenInfo?.description) {
      return { cleanDescription: '', socialLinks: {} };
    }
    return parseSocialLinksFromDescription(displayTokenInfo.description);
  }, [displayTokenInfo?.description]);
  
  if (!tokenAddress) {
    return <div>Token not found</div>;
  }

  if ((tokenInfoLoading || priceLoading) && !tokenInfoError && !priceError) {
    return (
      <div className="min-h-screen bg-somnia-bg text-foreground relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center space-y-4 relative z-10">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading token data...</span>
          <div className="text-sm text-muted-foreground text-center">
            <p>Fetching from blockchain...</p>
            <p className="font-mono text-xs mt-1">{tokenAddress?.slice(0, 8)}...{tokenAddress?.slice(-6)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (tokenInfoError) {
    return (
      <div className="min-h-screen bg-somnia-bg text-foreground relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error Loading Token</h2>
          <p className="text-muted-foreground mb-4">
            {tokenInfoError?.message || 'Failed to load token data'}
          </p>
          <div className="space-x-3">
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
            <Button onClick={() => navigate('/board')}>
              Back to Board
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenInfoLoading && !priceLoading && !tokenInfo) {
    return (
      <div className="min-h-screen bg-somnia-bg text-foreground relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <h2 className="text-xl font-bold mb-4">Token Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This token might not exist or hasn't been deployed yet.
          </p>
          <Button onClick={() => navigate('/board')}>
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
    <ErrorBoundary>
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
              <img
                src={displayTokenInfo.imageUri || `https://api.dicebear.com/7.x/identicon/svg?seed=${tokenAddress}`}
                alt={displayTokenInfo.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${tokenAddress}`;
                }}
                className="w-12 h-12 rounded-full border-2 border-somnia-border"
              />
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
            <Button
              variant="outline"
              size="sm"
              className={`border-somnia-border hover:bg-somnia-hover ${isFavorite ? 'bg-primary/10 border-primary' : ''}`}
              onClick={toggleFavorite}
            >
              <Star className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
              {isFavorite ? 'Favorited' : 'Add to Favorites'}
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
            <p className="text-xl font-bold text-foreground">{formatPrice(parseFloat(displayPrice))} SOMI</p>
            <p className="text-sm text-muted-foreground">per token</p>
          </Card>
          
          <Card className="bg-somnia-card border-somnia-border p-4">
            <p className="text-sm text-muted-foreground">Total Supply</p>
            <p className="text-xl font-bold text-foreground">{parseFloat(displayTokenInfo.totalSupply).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{displayTokenInfo.symbol}</p>
          </Card>
          
          <Card className="bg-somnia-card border-somnia-border p-4">
            <p className="text-sm text-muted-foreground">SOMI Raised</p>
            <p className="text-xl font-bold text-foreground">{parseFloat(displayTokenInfo.sttRaised).toFixed(2)} SOMI</p>
            <p className="text-sm text-muted-foreground">{displayTokenInfo.graduatedToDeX ? "Graduated" : "/ 10,000 SOMI"}</p>
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
            {/* Detailed Bonding Curve Analysis */}
            <DetailedBondingCurve
              tokenSymbol={displayTokenInfo.symbol}
              currentSupply={parseFloat(displayTokenInfo.tokensSold)}
              currentPrice={parseFloat(displayPrice)}
              liquidityPooled={parseFloat(displayTokenInfo.sttRaised)}
              totalSupply={parseFloat(displayTokenInfo.totalSupply)}
            />

            {/* Token Information */}
            <Card className="bg-somnia-card border-somnia-border p-6">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="bg-somnia-hover">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="tokenomics">Tokenomics</TabsTrigger>
                  <TabsTrigger value="community">Community</TabsTrigger>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">About {displayTokenInfo.name}</h3>
                    <p className="text-muted-foreground leading-relaxed">{cleanDescription || displayTokenInfo.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Contract Address</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <a
                          href={`https://explorer.somnia.network/address/${tokenAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-foreground hover:text-primary flex items-center space-x-2"
                        >
                          <span>{tokenAddress.slice(0, 20)}...</span>
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </a>
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
                        <p className="text-sm text-muted-foreground">SOMI Raised</p>
                        <p className="text-lg font-semibold text-foreground">{parseFloat(displayTokenInfo.sttRaised).toFixed(4)} SOMI</p>
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
                    
                    {/* Social Media Links */}
                    {(socialLinks.telegram || socialLinks.discord || socialLinks.twitter) && (
                      <div className="space-y-3">
                        <h4 className="text-md font-medium text-foreground">Social Media</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {socialLinks.telegram && (
                            <a
                              href={socialLinks.telegram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 p-3 bg-somnia-hover rounded-lg border border-somnia-border hover:border-primary transition-colors"
                            >
                              <TelegramIcon className="text-blue-500" size={16} />
                              <span className="text-sm font-medium">Telegram</span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                            </a>
                          )}
                          
                          {socialLinks.discord && (
                            <a
                              href={socialLinks.discord}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 p-3 bg-somnia-hover rounded-lg border border-somnia-border hover:border-primary transition-colors"
                            >
                              <DiscordIcon className="text-indigo-500" size={16} />
                              <span className="text-sm font-medium">Discord</span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                            </a>
                          )}
                          
                          {socialLinks.twitter && (
                            <a
                              href={socialLinks.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 p-3 bg-somnia-hover rounded-lg border border-somnia-border hover:border-primary transition-colors"
                            >
                              <TwitterIcon className="text-blue-400" size={16} />
                              <span className="text-sm font-medium">Twitter/X</span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Contract Info */}
                    <div className="pt-4 border-t border-somnia-border">
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
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="mt-6">
                  <TokenChat 
                    tokenAddress={tokenAddress}
                    tokenName={displayTokenInfo.name}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Trading and Activity */}
          <div className="space-y-8">
            {/* Trading Interface */}
            <ErrorBoundary fallback={
              <div className="p-4 border border-red-500/20 rounded bg-red-500/5 text-center">
                <p className="text-red-500">Error loading trading interface</p>
                <p className="text-sm text-muted-foreground mt-2">Please refresh the page to try again.</p>
              </div>
            }>
              <TradingInterface tokenAddress={tokenAddress} />
            </ErrorBoundary>

            {/* Activity Feed */}
            <ErrorBoundary fallback={
              <div className="p-4 border border-red-500/20 rounded bg-red-500/5 text-center">
                <p className="text-red-500">Error loading activity feed</p>
              </div>
            }>
              <ActivityFeed />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default TokenDetail;