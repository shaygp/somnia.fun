import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon, Coins } from 'lucide-react';
import { useAllTokens } from '@/hooks/usePumpFun';

interface MarketCapData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  tokens: number;
  logo?: string;
  address?: string;
}

const COLORS = [
  '#8b5cf6', // primary purple
  '#6366f1', // indigo
  '#7c3aed', // violet
  '#9333ea', // purple
  '#a855f7', // purple-400
  '#c084fc', // purple-300
  '#d8b4fe', // purple-200
  '#e9d5ff', // purple-100
  '#6b7280', // gray-500
  '#9ca3af', // gray-400
];

const MarketCapChart: React.FC = () => {
  const { tokens, isLoading } = useAllTokens();

  const marketCapData = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];

    // Calculate total market cap
    const totalMarketCap = tokens.reduce((sum, token) => {
      return sum + parseFloat(token.somiRaised || '0');
    }, 0);

    if (totalMarketCap === 0) return [];

    // Sort tokens by market cap and group
    const sortedTokens = [...tokens]
      .sort((a, b) => parseFloat(b.somiRaised || '0') - parseFloat(a.somiRaised || '0'))
      .filter(token => parseFloat(token.somiRaised || '0') > 0);

    const chartData: MarketCapData[] = [];
    let otherValue = 0;
    let otherTokens = 0;

    sortedTokens.forEach((token, index) => {
      const value = parseFloat(token.somiRaised || '0');
      const percentage = (value / totalMarketCap) * 100;

      if (index < 8 && percentage >= 1) {
        // Show top tokens with at least 1% share
        chartData.push({
          name: token.name.length > 12 ? token.name.slice(0, 12) + '...' : token.name,
          value: value,
          percentage: percentage,
          color: COLORS[index % COLORS.length],
          tokens: 1,
          logo: token.logo || token.imageUri || token.image,
          address: token.address
        });
      } else {
        // Group remaining tokens as "Others"
        otherValue += value;
        otherTokens += 1;
      }
    });

    // Add "Others" category if there are remaining tokens
    if (otherTokens > 0) {
      chartData.push({
        name: `Others (${otherTokens} tokens)`,
        value: otherValue,
        percentage: (otherValue / totalMarketCap) * 100,
        color: '#6b7280', // gray-500
        tokens: otherTokens
      });
    }

    return chartData;
  }, [tokens]);

  const totalMarketCap = useMemo(() => {
    if (!tokens) return 0;
    return tokens.reduce((sum, token) => sum + parseFloat(token.somiRaised || '0'), 0);
  }, [tokens]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-somnia-card border border-somnia-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-primary font-semibold">{data.value.toFixed(2)} SOMI</p>
          <p className="text-muted-foreground text-sm">{data.percentage.toFixed(1)}% of market</p>
          <p className="text-muted-foreground text-xs">{data.tokens} token{data.tokens > 1 ? 's' : ''}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="bg-somnia-card border-somnia-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <span>Market Cap Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground text-sm">Loading market data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (marketCapData.length === 0) {
    return (
      <Card className="bg-somnia-card border-somnia-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <span>Market Cap Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No market cap data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-somnia-card border-somnia-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PieChartIcon className="w-5 h-5 text-primary" />
          <span>Market Cap Distribution</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marketCapData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {marketCapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground mb-3">Top Tokens by Market Cap</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {marketCapData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-somnia-hover/30 rounded">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    {item.logo && item.address && (
                      <img
                        src={item.logo}
                        alt={item.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${item.address}`;
                        }}
                        className="w-5 h-5 rounded border border-somnia-border"
                      />
                    )}
                    <span className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">
                      {item.value.toFixed(1)} SOMI
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketCapChart;