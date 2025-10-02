import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Plus, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { CONTRACT_ADDRESSES, BONDING_CURVE_ABI, TOKEN_FACTORY_ABI } from "@/config/contracts";

interface Activity {
  type: "buy" | "sell" | "create";
  user: string;
  token: string;
  amount: string;
  value: string;
  timestamp: string;
  avatar: string;
  txHash: string;
}

const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!publicClient) return;

      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - 1000n > 0n ? currentBlock - 1000n : 0n;

        const [buyLogs, sellLogs, createLogs] = await Promise.all([
          publicClient.getLogs({
            address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
            event: {
              type: 'event',
              name: 'TokenBought',
              inputs: [
                { type: 'address', indexed: true, name: 'token' },
                { type: 'address', indexed: true, name: 'buyer' },
                { type: 'uint256', indexed: false, name: 'somiIn' },
                { type: 'uint256', indexed: false, name: 'tokensOut' },
                { type: 'uint256', indexed: false, name: 'newPrice' },
              ],
            },
            fromBlock,
            toBlock: currentBlock,
          }),
          publicClient.getLogs({
            address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
            event: {
              type: 'event',
              name: 'TokenSold',
              inputs: [
                { type: 'address', indexed: true, name: 'token' },
                { type: 'address', indexed: true, name: 'seller' },
                { type: 'uint256', indexed: false, name: 'tokensIn' },
                { type: 'uint256', indexed: false, name: 'somiOut' },
                { type: 'uint256', indexed: false, name: 'newPrice' },
              ],
            },
            fromBlock,
            toBlock: currentBlock,
          }),
          publicClient.getLogs({
            address: CONTRACT_ADDRESSES.TOKEN_FACTORY as `0x${string}`,
            event: {
              type: 'event',
              name: 'TokenCreated',
              inputs: [
                { type: 'address', indexed: true, name: 'tokenAddress' },
                { type: 'address', indexed: true, name: 'creator' },
                { type: 'string', indexed: false, name: 'name' },
                { type: 'string', indexed: false, name: 'symbol' },
                { type: 'uint256', indexed: false, name: 'totalSupply' },
              ],
            },
            fromBlock,
            toBlock: currentBlock,
          }),
        ]);

        const parsedActivities: Activity[] = [];

        for (const log of buyLogs) {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          parsedActivities.push({
            type: "buy",
            user: `${log.topics[2]?.slice(0, 6)}...${log.topics[2]?.slice(-4)}`,
            token: `${log.topics[1]?.slice(0, 6)}...${log.topics[1]?.slice(-4)}`,
            amount: "tokens",
            value: "SOMI",
            timestamp: formatTimestamp(Number(block.timestamp)),
            avatar: "📈",
            txHash: log.transactionHash || "",
          });
        }

        for (const log of sellLogs) {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          parsedActivities.push({
            type: "sell",
            user: `${log.topics[2]?.slice(0, 6)}...${log.topics[2]?.slice(-4)}`,
            token: `${log.topics[1]?.slice(0, 6)}...${log.topics[1]?.slice(-4)}`,
            amount: "tokens",
            value: "SOMI",
            timestamp: formatTimestamp(Number(block.timestamp)),
            avatar: "📉",
            txHash: log.transactionHash || "",
          });
        }

        for (const log of createLogs) {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          parsedActivities.push({
            type: "create",
            user: `${log.topics[2]?.slice(0, 6)}...${log.topics[2]?.slice(-4)}`,
            token: `${log.topics[1]?.slice(0, 6)}...${log.topics[1]?.slice(-4)}`,
            amount: "new token",
            value: "10 SOMI",
            timestamp: formatTimestamp(Number(block.timestamp)),
            avatar: "🚀",
            txHash: log.transactionHash || "",
          });
        }

        parsedActivities.sort((a, b) => {
          const timeA = parseTimestamp(a.timestamp);
          const timeB = parseTimestamp(b.timestamp);
          return timeB - timeA;
        });

        setActivities(parsedActivities.slice(0, 10));
      } catch (error) {
        console.error("Error fetching activity:", error);
      }
    };

    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 30000);
    return () => clearInterval(interval);
  }, [publicClient]);

  const formatTimestamp = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const parseTimestamp = (timestamp: string): number => {
    const match = timestamp.match(/(\d+)([smhd])/);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return Date.now() / 1000 - value * multipliers[unit];
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "buy":
        return <ArrowUpRight className="w-4 h-4 text-primary" />;
      case "sell":
        return <ArrowDownRight className="w-4 h-4 text-destructive" />;
      case "create":
        return <Plus className="w-4 h-4 text-somnia-blue" />;
      default:
        return null;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "buy":
        return "border-l-primary bg-primary/5";
      case "sell":
        return "border-l-destructive bg-destructive/5";
      case "create":
        return "border-l-somnia-blue bg-somnia-blue/5";
      default:
        return "border-l-muted";
    }
  };

  return (
    <Card className="bg-somnia-card border-somnia-border p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Live Activity</h3>
            <p className="text-sm text-muted-foreground">Real-time trading activity</p>
          </div>
          <Badge variant="secondary" className="bg-primary/20 text-primary animate-pulse">
            Live
          </Badge>
        </div>

        {/* Activity List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          ) : activities.map((activity, index) => (
            <div
              key={index}
              className={`border-l-2 pl-4 py-3 rounded-r-lg transition-all duration-200 hover:bg-somnia-hover/50 ${getActivityColor(activity.type)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getActivityIcon(activity.type)}
                    <span className="text-2xl">{activity.avatar}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className="text-xs border-somnia-border bg-somnia-hover text-foreground"
                      >
                        {activity.token}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {activity.type === "create" ? "created" : activity.type}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {activity.amount}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-muted-foreground font-mono">
                        {activity.user}
                      </span>
                      <span className="text-xs text-primary font-medium">
                        {activity.value}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    {activity.timestamp}
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
          ))}

        {/* Footer */}
        <div className="pt-3 border-t border-somnia-border text-center">
          <p className="text-xs text-muted-foreground">
            Powered by Somnia • Real-time data
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ActivityFeed;