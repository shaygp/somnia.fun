import { MessageCircle, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BondingCurveChart from "./BondingCurveChart";

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
  showChart?: boolean;
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
  liquidityPooled = 45.6,
  showChart = false
}: TokenCardProps) => {
  return (
    <Card className="group bg-somnia-card border-somnia-border hover:border-primary/50 transition-all duration-300 hover:shadow-somnia-glow cursor-pointer relative overflow-hidden">
      <div className="p-4 relative z-10">
        {/* Terminal-style header */}
        <div className="flex items-start justify-between mb-3 border-b border-somnia-border pb-2">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src={image} 
                alt={name} 
                className="w-10 h-10 rounded border border-somnia-border group-hover:border-primary/50 transition-colors"
              />
              {trending && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded flex items-center justify-center">
                  <span className="text-xs text-primary-foreground">*</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-primary group-hover:text-primary/80 transition-colors">
                {name.toUpperCase()}
              </h3>
              <p className="text-xs text-muted-foreground">
                ${symbol.toLowerCase()}
              </p>
            </div>
          </div>
          
          {trending && (
            <span className="text-xs text-primary bg-primary/20 px-1 py-0.5 rounded border border-primary/30">
              hot
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
          # {description}
        </p>

        {/* Terminal-style stats */}
        <div className="space-y-1 mb-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">market_cap:</span>
            <span className="text-foreground font-medium">{marketCap}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">price:</span>
            <div className="flex items-center space-x-2">
              <span className="text-foreground font-medium">{price}</span>
              <span className={`text-xs px-1 py-0.5 rounded ${
                change24h >= 0 
                  ? 'text-primary bg-primary/20' 
                  : 'text-destructive bg-destructive/20'
              }`}>
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">holders:</span>
            <span className="text-foreground font-medium">{holders.toLocaleString()}</span>
          </div>
        </div>

        {/* Terminal actions */}
        <div className="space-y-2 pt-2 border-t border-somnia-border">
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
              buy()
            </Button>
            <Button size="sm" variant="outline" className="border-somnia-border hover:bg-somnia-hover text-xs">
              sell()
            </Button>
          </div>
        </div>

        {/* Bonding Curve Chart (for featured tokens) */}
        {showChart && (
          <div className="mt-3 pt-3 border-t border-somnia-border">
            <BondingCurveChart
              tokenSymbol={symbol}
              currentSupply={500000}
              currentPrice={parseFloat(price.replace('$', ''))}
              liquidityPooled={liquidityPooled}
            />
          </div>
        )}
      </div>
      
      {/* Subtle scan lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="scan-lines w-full h-full"></div>
      </div>
    </Card>
  );
};

export default TokenCard;