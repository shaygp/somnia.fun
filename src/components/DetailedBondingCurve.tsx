import React, { useState } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, ReferenceDot } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Droplets, Users, Info, Calculator } from 'lucide-react';
import { formatPrice, formatSomi } from '@/utils/formatters';

interface DetailedBondingCurveProps {
  tokenSymbol: string;
  currentSupply: number;
  currentPrice: number;
  liquidityPooled: number;
  totalSupply?: number;
  className?: string;
}

interface CurveDataPoint {
  supply: number;
  price: number;
  liquidity: number;
  marketCap: number;
  supplyPercent: number;
}

const DetailedBondingCurve: React.FC<DetailedBondingCurveProps> = ({
  tokenSymbol,
  currentSupply,
  currentPrice,
  liquidityPooled,
  totalSupply = 1000000000,
  className
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Bonding curve parameters
  const GRADUATION_LIQUIDITY = 10000; // 10,000 SOMI to graduate
  const GRADUATION_SUPPLY = totalSupply * 0.8; // 80% of supply before graduation
  const INITIAL_PRICE = 0.00000001; // Starting price
  const GRADUATION_PRICE = GRADUATION_LIQUIDITY / GRADUATION_SUPPLY; // Price at graduation
  
  // Calculate current status
  const progressToGraduation = Math.min((liquidityPooled / GRADUATION_LIQUIDITY) * 100, 100);
  const supplyProgress = Math.min((currentSupply / GRADUATION_SUPPLY) * 100, 100);
  const isGraduated = liquidityPooled >= GRADUATION_LIQUIDITY;
  const marketCap = currentSupply * currentPrice;
  
  // Generate bonding curve data
  const generateBondingCurveData = (): CurveDataPoint[] => {
    const dataPoints: CurveDataPoint[] = [];
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const supplyPercent = (i / steps) * 80; // Up to 80% of total supply
      const supply = (totalSupply * supplyPercent) / 100;
      
      // Exponential bonding curve: price = initial_price * (1 + supply/total)^2
      const supplyRatio = supply / totalSupply;
      const price = INITIAL_PRICE * Math.pow(1 + supplyRatio * 10, 2);
      
      // Linear liquidity accumulation
      const liquidity = (supplyRatio * GRADUATION_LIQUIDITY * 1.25); // 25% buffer
      
      const point: CurveDataPoint = {
        supply: Math.round(supply),
        price: parseFloat(price.toFixed(10)),
        liquidity: parseFloat(liquidity.toFixed(2)),
        marketCap: parseFloat((supply * price).toFixed(2)),
        supplyPercent: parseFloat(supplyPercent.toFixed(1))
      };
      
      dataPoints.push(point);
    }
    
    // Add current position if we have real data
    if (currentSupply > 0) {
      const currentPercent = (currentSupply / totalSupply) * 100;
      dataPoints.push({
        supply: currentSupply,
        price: currentPrice,
        liquidity: liquidityPooled,
        marketCap,
        supplyPercent: parseFloat(currentPercent.toFixed(1))
      });
      
      // Sort by supply to maintain curve
      dataPoints.sort((a, b) => a.supply - b.supply);
    }
    
    return dataPoints;
  };

  const curveData = generateBondingCurveData();
  
  
  
  // Calculate real market cap from API data
  const realMarketCap = liquidityPooled; // This comes from the API as the real market cap
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-somnia-card border border-somnia-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">Supply: {(data.supply / 1000000).toFixed(1)}M {tokenSymbol}</p>
          <p className="text-primary">Price: {formatPrice(data.price)} SOMI</p>
          <p className="text-accent">Liquidity: {formatSomi(data.liquidity)} SOMI</p>
          <p className="text-muted-foreground">Market Cap: {formatSomi(data.marketCap)} SOMI</p>
          <p className="text-xs text-muted-foreground">Supply: {data.supplyPercent}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`bg-somnia-card border-somnia-border ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-primary" />
              Bonding Curve Analysis
            </h3>
            <p className="text-sm text-muted-foreground">{tokenSymbol} Price Discovery Mechanism</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={isGraduated ? "default" : "secondary"} className="flex items-center">
              <Target className="w-3 h-3 mr-1" />
              {isGraduated ? "Graduated" : "Pre-DEX"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Info className="w-4 h-4 mr-1" />
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </div>

        {/* Current Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-somnia-hover/30 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Calculator className="w-4 h-4 text-primary mr-1" />
              <span className="text-xs text-muted-foreground">Current Price</span>
            </div>
            <p className="font-bold text-foreground">
              {formatPrice(currentPrice)} SOMI
            </p>
          </div>
          
          <div className="bg-somnia-hover/30 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Droplets className="w-4 h-4 text-accent mr-1" />
              <span className="text-xs text-muted-foreground">Liquidity Pool</span>
            </div>
            <p className="font-bold text-foreground">{formatSomi(liquidityPooled)} SOMI</p>
            <p className="text-xs text-muted-foreground">{progressToGraduation.toFixed(1)}% to Somnex DEX</p>
          </div>
          
          <div className="bg-somnia-hover/30 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Users className="w-4 h-4 text-secondary mr-1" />
              <span className="text-xs text-muted-foreground">Market Cap</span>
            </div>
            <p className="font-bold text-foreground">{formatSomi(realMarketCap)} SOMI</p>
            <p className="text-xs text-muted-foreground">{((currentSupply / totalSupply) * 100).toFixed(1)}% circulating</p>
          </div>
          
          <div className="bg-somnia-hover/30 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Target className="w-4 h-4 text-destructive mr-1" />
              <span className="text-xs text-muted-foreground">Graduation Target</span>
            </div>
            <p className="font-bold text-foreground">{GRADUATION_LIQUIDITY.toLocaleString()} SOMI</p>
            <p className="text-xs text-muted-foreground">{formatSomi(GRADUATION_LIQUIDITY - liquidityPooled)} remaining</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Progress to Somnex DEX</span>
              <span className="text-sm text-muted-foreground">{formatSomi(liquidityPooled)}/{GRADUATION_LIQUIDITY.toLocaleString()} SOMI</span>
            </div>
            <Progress value={progressToGraduation} className="h-2" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Supply Progress</span>
              <span className="text-sm text-muted-foreground">{supplyProgress.toFixed(1)}%</span>
            </div>
            <Progress value={supplyProgress} className="h-2" />
          </div>
        </div>

        {/* Bonding Curve Chart */}
        <div className="h-[400px] w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={curveData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--somnia-lime))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--somnia-lime))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--somnia-blue))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--somnia-blue))" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              
              <XAxis 
                dataKey="supply" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              
              <YAxis 
                yAxisId="price"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => formatPrice(value)}
              />
              
              <YAxis 
                yAxisId="liquidity"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${formatSomi(value)}`}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Graduation line */}
              <ReferenceLine y={GRADUATION_LIQUIDITY} yAxisId="liquidity" stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
              
              {/* Current position */}
              {currentSupply > 0 && (
                <ReferenceDot
                  x={currentSupply}
                  y={currentPrice}
                  yAxisId="price"
                  r={6}
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              )}
              
              {/* Price curve */}
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--somnia-lime))"
                strokeWidth={3}
                fill="url(#priceGradient)"
                name="Price (SOMI)"
              />
              
              {/* Liquidity line */}
              <Line
                yAxisId="liquidity"
                type="monotone"
                dataKey="liquidity"
                stroke="hsl(var(--somnia-blue))"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                name="Liquidity (SOMI)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Information */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-somnia-border">
            <h4 className="font-semibold text-foreground flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Bonding Curve Mechanics
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-foreground">Price Discovery</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Exponential bonding curve mechanism</li>
                  <li>• Price increases with each token sold</li>
                  <li>• Early buyers get lower prices</li>
                  <li>• No slippage from other traders</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-foreground">DEX Graduation</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Requires {GRADUATION_LIQUIDITY.toLocaleString()} SOMI liquidity</li>
                  <li>• 36 SOMI locked permanently</li>
                  <li>• Remaining liquidity to DEX</li>
                  <li>• Trading moves to Somnex</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-foreground">Current Status</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Supply: {((currentSupply / totalSupply) * 100).toFixed(2)}% circulating</li>
                  <li>• Progress: {progressToGraduation.toFixed(1)}% to graduation</li>
                  <li>• Remaining: {formatSomi(GRADUATION_LIQUIDITY - liquidityPooled)} SOMI needed</li>
                  <li>• Status: {isGraduated ? 'Ready for DEX' : 'Building liquidity'}</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium text-foreground">Key Metrics</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Initial Price: {formatPrice(INITIAL_PRICE)} SOMI</li>
                  <li>• Graduation Price: ~{formatPrice(GRADUATION_PRICE)} SOMI</li>
                  <li>• Total Supply: {(totalSupply / 1000000000).toFixed(1)}B tokens</li>
                  <li>• Tradeable: {((GRADUATION_SUPPLY / totalSupply) * 100).toFixed(0)}% before DEX</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DetailedBondingCurve;