import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import WalletConnection from "./WalletConnection";
import CreateTokenModal from "./CreateTokenModal";
import { useState } from "react";
// Logo will be loaded from public directory
import { useAllTokens, useTokenInfo } from "@/hooks/usePumpFun";

const Header = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { tokens } = useAllTokens();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchQuery.startsWith('0x') && searchQuery.length === 42) {
      navigate(`/token/${searchQuery}`);
    } else {
      const matchingToken = tokens?.find(token => {
        return token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
               token.address.toLowerCase().includes(searchQuery.toLowerCase());
      });

      if (matchingToken) {
        navigate(`/token/${matchingToken.address}`);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-somnia-border bg-somnia-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo and Navigation */}
        <div className="flex items-center space-x-8">
          <Link to="/board" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="Somnia.fun" className="w-8 h-8" />
            <div>
            <h1 className="text-lg font-medium text-primary terminal-cursor">SOMNIA.FUN</h1>
            <p className="text-xs text-muted-foreground">token_launchpad.exe</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
              <Link to="/board">./board</Link>
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-primary"
              onClick={() => setShowCreateModal(true)}
            >
              ./create
            </Button>
            <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
              <Link to="/somnex">./somnex</Link>
            </Button>
            <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
              <Link to="/portfolio">./portfolio</Link>
            </Button>
          </nav>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tokens or paste address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-somnia-card border-somnia-border focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </form>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <WalletConnection />
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            data-create-token
          >
            ./new_token
          </Button>
        </div>
      </div>
      
      <CreateTokenModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </header>
  );
};

export default Header;