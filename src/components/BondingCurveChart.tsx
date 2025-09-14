import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Lock, Droplets } from "lucide-react";

const mockData = [
  { supply: 0, price: 0.0001, liquidity: 0 },
  { supply: 100000, price: 0.0005, liquidity: 10 },
  { supply: 250000, price: 0.0012, liquidity: 25 },
  { supply: 500000, price: 0.0028, liquidity: 45 },
  { supply: 750000, price: 0.0055, liquidity: 68 },
  { supply: 1000000, price: 0.01, liquidity: 80 }, // DEX threshold
  { supply: 1250000, price: 0.015, liquidity: 80 },
  { supply: 1500000, price: 0.022, liquidity: 80 },
];

interface BondingCurveChartProps {
  tokenSymbol: string;
  currentSupply: number;
  currentPrice: number;
  liquidityPooled: number;
  className?: string;
}

const BondingCurveChart = ({ 
  tokenSymbol, 
  currentSupply, 
  currentPrice, 
  liquidityPooled,
  className 
}: BondingCurveChartProps) => {
  const progress = (liquidityPooled / 80) * 100;
  const isDexReady = liquidityPooled >= 80;

  return (
    <Card className={`bg-somnia-card border-somnia-border p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Bonding Curve</h3>
            <p className="text-sm text-muted-foreground">{tokenSymbol} Price Discovery</p>
          </div>
          <Badge 
            variant={isDexReady ? "default" : "secondary"}
            className={isDexReady ? "bg-primary text-primary-foreground" : "bg-secondary"}
          >
            {isDexReady ? "DEX Ready" : "Building Liquidity"}
          </Badge>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--somnia-lime))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--somnia-lime))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--somnia-blue))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--somnia-blue))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--somnia-border))" />
              <XAxis 
                dataKey="supply" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value/1000}K`}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value} STT`}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--somnia-lime))" 
                strokeWidth={2}
                fill="url(#priceGradient)" 
              />
              <Line 
                type="monotone" 
                dataKey="liquidity" 
                stroke="hsl(var(--somnia-blue))" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Current Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-primary mr-1" />
              <span className="text-xs text-muted-foreground">Current Price</span>
            </div>
            <p className="font-semibold text-foreground">{currentPrice.toFixed(6)} STT</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Droplets className="w-4 h-4 text-accent mr-1" />
              <span className="text-xs text-muted-foreground">Liquidity Pool</span>
            </div>
            <p className="font-semibold text-foreground">{liquidityPooled}/1000 STT</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Lock className="w-4 h-4 text-muted-foreground mr-1" />
              <span className="text-xs text-muted-foreground">Locked</span>
            </div>
            <p className="font-semibold text-muted-foreground">
              {isDexReady ? "36 STT" : "0 STT"}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to DEX</span>
            <span className="text-foreground font-medium">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-somnia-hover rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {isDexReady 
              ? "✅ Ready for DEX listing. 36 STT will be permanently locked."
              : `${(80 - liquidityPooled).toFixed(1)} STT needed to unlock DEX listing`
            }
          </p>
        </div>
      </div>
    </Card>
  );
};

export default BondingCurveChart;