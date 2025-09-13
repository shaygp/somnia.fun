import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TokenGrid from "@/components/TokenGrid";
import AnimatedBackground from "@/components/AnimatedBackground";
import StatsCards from "@/components/StatsCards";

const Index = () => {
  return (
    <div className="min-h-screen bg-somnia-bg text-foreground relative">
      <AnimatedBackground />
      <Header />
      <div className="flex relative z-10">
        <Sidebar />
        <main className="flex-1 p-6">
          <StatsCards />
          <TokenGrid />
        </main>
      </div>
    </div>
  );
};

export default Index;
