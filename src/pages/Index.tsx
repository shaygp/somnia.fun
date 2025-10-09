import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TokenGrid from "@/components/TokenGrid";
import AnimatedBackground from "@/components/AnimatedBackground";
import StatsCards from "@/components/StatsCards";
import MarketCapChart from "@/components/MarketCapChart";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const filter = searchParams.get('filter');
  const help = searchParams.get('help');

  const closeHelp = () => {
    const newParams = new URLSearchParams(location.search);
    newParams.delete('help');
    const newSearch = newParams.toString();
    navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-somnia-bg text-foreground relative">
        <AnimatedBackground />
        <Header />
        <div className="flex relative z-10">
          <Sidebar />
          <main className="flex-1 p-3 md:p-6">
            {help && (
              <div className="mb-6 bg-somnia-card border border-somnia-border rounded-lg p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Help & Documentation</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeHelp}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>Welcome to Somnia.fun - the premier token launchpad on Somnia Network!</p>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">How to Create a Token:</h3>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Connect your wallet to Somnia Testnet</li>
                      <li>Click "Create Token" and fill in your token details</li>
                      <li>Optionally add social media links (Telegram, Discord, Twitter)</li>
                      <li>Pay the creation fee (10 SOMI)</li>
                      <li>Your token will be live on a bonding curve</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Trading & Graduation:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Tokens start on bonding curves for price discovery</li>
                      <li>When 10,000 SOMI is raised, tokens graduate to Somnex DEX</li>
                      <li>15,000 SOMI is permanently locked as liquidity</li>
                      <li>Graduated tokens can be traded on the DEX</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <ErrorBoundary fallback={
              <div className="p-4 border border-red-500/20 rounded bg-red-500/5 text-center">
                <p className="text-red-500">Error loading stats</p>
              </div>
            }>
              <StatsCards />
            </ErrorBoundary>
            
            {/* Market Cap Distribution Chart */}
            <ErrorBoundary fallback={
              <div className="p-4 border border-red-500/20 rounded bg-red-500/5 text-center">
                <p className="text-red-500">Error loading market cap chart</p>
              </div>
            }>
              <MarketCapChart />
            </ErrorBoundary>
            <ErrorBoundary fallback={
              <div className="p-4 border border-red-500/20 rounded bg-red-500/5 text-center">
                <p className="text-red-500">Error loading tokens. Please check your wallet connection and network.</p>
              </div>
            }>
              <TokenGrid filter={filter} />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
