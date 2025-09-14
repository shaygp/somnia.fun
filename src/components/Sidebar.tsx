import { Home, TrendingUp, Clock, Star, Plus, Settings, HelpCircle, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation } from "react-router-dom";
import SomniaLinks from "./SomniaLinks";

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "All Tokens", path: "/board", active: location.pathname === "/board" },
    { icon: ArrowRightLeft, label: "Somnex DEX", path: "/somnex", active: location.pathname === "/somnex" },
    { icon: TrendingUp, label: "Trending", path: "/board?filter=trending", count: 24, active: location.search === "?filter=trending" },
    { icon: Clock, label: "Recently Created", path: "/board?filter=recent", count: 156, active: location.search === "?filter=recent" },
    { icon: Star, label: "Favorites", path: "/board?filter=favorites", count: 8, active: location.search === "?filter=favorites" },
  ];

  const quickActions = [
    { icon: Plus, label: "Create Token", highlight: true, action: () => {
      (document.querySelector('[data-create-token]') as HTMLButtonElement)?.click();
    }},
    { icon: Settings, label: "Portfolio", path: "/portfolio" },
    { icon: HelpCircle, label: "Help", path: "/board?help=true" },
  ];

  return (
    <aside className="w-64 bg-somnia-card border-r border-somnia-border p-4 hidden lg:block">
      {/* Navigation */}
      <div className="space-y-2 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
          Discover
        </h2>
        {navItems.map((item) => (
          <Button
            key={item.label}
            asChild={!!item.path}
            variant={item.active ? "secondary" : "ghost"}
            className={`w-full justify-start text-left ${
              item.active 
                ? "bg-primary/20 text-primary hover:bg-primary/30" 
                : "hover:bg-somnia-hover"
            }`}
          >
            {item.path ? (
              <Link to={item.path}>
                <item.icon className="w-4 h-4 mr-3" />
                <span className="flex-1">{item.label}</span>
                {item.count && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                )}
              </Link>
            ) : (
              <>
                <item.icon className="w-4 h-4 mr-3" />
                <span className="flex-1">{item.label}</span>
                {item.count && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                )}
              </>
            )}
          </Button>
        ))}
      </div>

      <Separator className="my-6 bg-somnia-border" />

      {/* Quick Actions */}
      <div className="space-y-2 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
          Quick Actions
        </h2>
        {quickActions.map((item) => (
          <Button
            key={item.label}
            asChild={!!item.path && !item.action}
            variant={item.highlight ? "default" : "ghost"}
            className={`w-full justify-start ${
              item.highlight 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "hover:bg-somnia-hover"
            }`}
            onClick={item.action}
          >
            {item.path && !item.action ? (
              <Link to={item.path}>
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Link>
            ) : (
              <>
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </>
            )}
          </Button>
        ))}
      </div>

      <Separator className="my-6 bg-somnia-border" />

      {/* Stats */}
      <div className="bg-somnia-gradient rounded-lg p-4 border border-somnia-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Somnia Stats
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Tokens</span>
            <span className="text-foreground font-medium">2,847</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">24h Volume</span>
            <span className="text-primary font-medium">$24.8M</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active Traders</span>
            <span className="text-foreground font-medium">18,394</span>
          </div>
        </div>
      </div>

      <Separator className="my-6 bg-somnia-border" />

      {/* Somnia Resources */}
      <SomniaLinks />
    </aside>
  );
};

export default Sidebar;