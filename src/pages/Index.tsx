import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TokenGrid from "@/components/TokenGrid";
import AnimatedBackground from "@/components/AnimatedBackground";
import StatsCards from "@/components/StatsCards";

const Index = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const filter = searchParams.get('filter');
  const help = searchParams.get('help');

  return (
    <div className="min-h-screen bg-somnia-bg text-foreground relative">
      <AnimatedBackground />
      <Header />
      <div className="flex relative z-10">
        <Sidebar />
        <main className="flex-1 p-6">
          {help && (
            <div className="mb-6 bg-somnia-card border border-somnia-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Help & Documentation</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Welcome to Somnia.fun - the premier token launchpad on Somnia Network!</p>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">How to Create a Token:</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Connect your wallet to Somnia Testnet</li>
                    <li>Click "Create Token" and fill in your token details</li>
                    <li>Pay the creation fee (0.1 STT)</li>
                    <li>Your token will be live on a bonding curve</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Trading & Graduation:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tokens start on bonding curves for price discovery</li>
                    <li>When 1000 STT is raised, tokens graduate to Somnex DEX</li>
                    <li>36 STT is permanently locked as liquidity</li>
                    <li>Graduated tokens can be traded on the DEX</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          <StatsCards />
          <TokenGrid filter={filter} />
        </main>
      </div>
    </div>
  );
};

export default Index;
