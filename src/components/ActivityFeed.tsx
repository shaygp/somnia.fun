import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Plus, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

const ActivityFeed = () => {
  const activities = [
    {
      type: "buy",
      user: "0x1234...5678",
      token: "PEPE",
      amount: "1,250",
      value: "0.15 STT",
      timestamp: "2m ago",
      avatar: "🐸"
    },
    {
      type: "sell",
      user: "0x9876...3210",
      token: "LDOG",
      amount: "500",
      value: "0.08 STT",
      timestamp: "3m ago",
      avatar: "🐕"
    },
    {
      type: "create",
      user: "0x5555...7777",
      token: "MOON",
      amount: "1,000,000",
      value: "0.5 STT",
      timestamp: "5m ago",
      avatar: "🌙"
    },
    {
      type: "buy",
      user: "0x1111...9999",
      token: "XTKN",
      amount: "2,000",
      value: "0.24 STT",
      timestamp: "7m ago",
      avatar: "⚡"
    },
    {
      type: "sell",
      user: "0x3333...4444",
      token: "DCAT",
      amount: "800",
      value: "0.12 STT",
      timestamp: "9m ago",
      avatar: "🐱"
    }
  ];

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
          {activities.map((activity, index) => (
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
        </div>

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