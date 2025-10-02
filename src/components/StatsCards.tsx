import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES, TOKEN_FACTORY_ABI } from "@/config/contracts";
import { useEffect, useState } from "react";

const StatsCards = () => {
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const [totalMarketCap, setTotalMarketCap] = useState<string>("0");

  const { data: allTokens } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY as `0x${string}`,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getAllTokens',
  });

  useEffect(() => {
    if (allTokens && Array.isArray(allTokens)) {
      setTotalTokens(allTokens.length);
    }
  }, [allTokens]);

  const stats = [
    {
      title: "Total Tokens",
      value: totalTokens.toString(),
      change: "+",
      icon: Activity,
      color: "text-somnia-purple"
    },
    {
      title: "Market Cap",
      value: `${totalMarketCap} SOMI`,
      change: "+",
      icon: TrendingUp,
      color: "text-primary"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-somnia-card border-somnia-border p-4 hover:shadow-somnia-glow transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1 text-primary" />
                <span className="text-xs text-primary font-medium">{stat.change}</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg bg-somnia-hover group-hover:bg-somnia-border transition-colors`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;