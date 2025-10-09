import { TrendingUp, Users, BarChart3, MessageCircle } from "lucide-react";
import { parseSocialLinksFromDescription } from "@/utils/socialLinks";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TokenCardProps {
  name: string;
  symbol: string;
  image: string;
  marketCap: string;
  price: string;
  change24h: number;
  replies: number;
  holders: number;
  description: string;
  trending?: boolean;
  liquidityPooled?: number;
  tokensSold?: number;
  showChart?: boolean;
  address?: string;
  graduatedToDeX?: boolean;
  sttRaised?: string;
}

const TokenCard = ({
  name,
  symbol,
  image,
  marketCap,
  price,
  change24h,
  replies,
  holders,
  description,
  trending = false,
  liquidityPooled = 0,
  tokensSold = 0,
  showChart = false,
  address,
  graduatedToDeX = false,
  sttRaised = "0"
}: TokenCardProps) => {
  // DEX graduation threshold: 10,000 SOMI raised
  const DEX_GRADUATION_THRESHOLD = 10000;
  const sttRaisedValue = parseFloat(sttRaised || "0");
  const progressToDeX = Math.min((sttRaisedValue / DEX_GRADUATION_THRESHOLD) * 100, 100);
  
  // Check if token has social links
  const { socialLinks } = parseSocialLinksFromDescription(description);
  const hasSocialLinks = Object.keys(socialLinks).length > 0;
  return (
    <Card className="group bg-somnia-card border-somnia-border hover:border-primary/50 transition-all duration-300 hover:shadow-somnia-glow cursor-pointer relative overflow-hidden">
      <div className="p-3 relative z-10">
        {/* Compact header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <img
                src={image}
                alt={name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${address || name}`;
                }}
                className="w-6 h-6 rounded border border-somnia-border group-hover:border-primary/50 transition-colors"
              />
              {trending && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded">
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xs font-medium text-primary group-hover:text-primary/80 transition-colors line-clamp-1">
                {name.toUpperCase()}
              </h3>
              <p className="text-xs text-muted-foreground">
                ${symbol.toLowerCase()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {graduatedToDeX && (
              <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-primary/30 text-primary">
                DEX
              </Badge>
            )}
            {trending && (
              <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-primary/30 text-primary">
                HOT
              </Badge>
            )}
            {hasSocialLinks && (
              <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-blue-500/30 text-blue-400">
                <MessageCircle className="w-2 h-2" />
              </Badge>
            )}
          </div>
        </div>

        {/* Key metrics - prominently displayed */}
        <div className="space-y-2 mb-3">
          {/* Market Cap - Biggest emphasis */}
          <div className="text-center py-2 bg-somnia-hover/50 rounded border border-somnia-border/50">
            <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
            <div className="text-lg font-bold text-primary">{marketCap}</div>
          </div>
          
          {/* Price and Progress row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center py-1 bg-somnia-hover/30 rounded">
              <div className="text-xs text-muted-foreground">Price</div>
              <div className="text-sm font-semibold text-foreground">{price}</div>
            </div>
            <div className="text-center py-1 bg-somnia-hover/30 rounded">
              <div className="text-xs text-muted-foreground">To DEX</div>
              <div className="text-sm font-semibold text-primary">{progressToDeX.toFixed(1)}%</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-somnia-border rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressToDeX, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Description - smaller */}
        {description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
            {description}
          </p>
        )}

        {/* Compact actions */}
        <div className="grid grid-cols-2 gap-1 pt-2 border-t border-somnia-border">
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-2 h-7">
            BUY
          </Button>
          <Button size="sm" variant="outline" className="border-somnia-border hover:bg-somnia-hover text-xs px-2 h-7">
            SELL
          </Button>
        </div>
      </div>
      
      {/* Subtle scan lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="scan-lines w-full h-full"></div>
      </div>
    </Card>
  );
};

export default TokenCard;