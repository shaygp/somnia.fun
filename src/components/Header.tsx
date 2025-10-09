import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import WalletConnection from "./WalletConnection";
import CreateTokenModal from "./CreateTokenModal";
import ProfileModal from "./ProfileModal";
import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { getProfile, createDefaultProfile } from "@/utils/profile";
// Logo will be loaded from public directory
import { useAllTokens, useTokenInfo } from "@/hooks/usePumpFun";

const Header = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredTokens, setFilteredTokens] = useState<any[]>([]);
  const navigate = useNavigate();
  const { tokens } = useAllTokens();
  const { isConnected, address } = useAccount();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get user profile for header avatar
  const userProfile = address ? getProfile(address) || createDefaultProfile(address) : null;

  // Filter tokens based on search query
  useEffect(() => {
    if (!searchQuery.trim() || !tokens) {
      setFilteredTokens([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = tokens.filter(token => {
      const query = searchQuery.toLowerCase();
      return token.name.toLowerCase().includes(query) ||
             token.symbol.toLowerCase().includes(query) ||
             token.address.toLowerCase().includes(query);
    }).slice(0, 5); // Limit to 5 suggestions

    setFilteredTokens(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [searchQuery, tokens]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchQuery.startsWith('0x') && searchQuery.length === 42) {
      navigate(`/token/${searchQuery}`);
      setShowSuggestions(false);
      setSearchQuery("");
    } else {
      const matchingToken = tokens?.find(token => {
        return token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
               token.address.toLowerCase().includes(searchQuery.toLowerCase());
      });

      if (matchingToken) {
        navigate(`/token/${matchingToken.address}`);
        setShowSuggestions(false);
        setSearchQuery("");
      }
    }
  };

  const handleSelectToken = (token: any) => {
    navigate(`/token/${token.address}`);
    setShowSuggestions(false);
    setSearchQuery("");
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (filteredTokens.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-somnia-border bg-somnia-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
        {/* Logo and Navigation */}
        <div className="flex items-center space-x-4 md:space-x-8">
          <Link to="/board" className="flex items-center space-x-2 md:space-x-3 hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="Somnia.fun" className="w-6 h-6 md:w-8 md:h-8" />
            <div className="hidden sm:block">
            <h1 className="text-sm md:text-lg font-medium text-primary terminal-cursor">SOMNIA.FUN</h1>
            <p className="text-xs text-muted-foreground hidden md:block">token_launchpad.exe</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
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

        {/* Search Bar - Hidden on small screens */}
        <div ref={searchRef} className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8 relative">
          <form onSubmit={handleSearch} className="w-full relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
            <Input
              ref={inputRef}
              placeholder="Search tokens or paste address..."
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              className="pl-10 bg-somnia-card border-somnia-border focus:border-primary focus:ring-1 focus:ring-primary w-full"
            />
          </form>
          
          {/* Search Suggestions */}
          {showSuggestions && filteredTokens.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-somnia-card border border-somnia-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {filteredTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleSelectToken(token)}
                  className="w-full px-3 py-2 text-left hover:bg-somnia-hover transition-colors flex items-center space-x-3 border-b border-somnia-border/50 last:border-b-0"
                >
                  <img
                    src={token.logo || token.imageUri || token.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${token.address}`}
                    alt={token.name}
                    className="w-6 h-6 rounded border border-somnia-border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${token.address}`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {token.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${token.symbol} • {token.somiRaised} SOMI
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 md:space-x-3">
          <WalletConnection />
          
          {/* Profile Button - Only show when connected */}
          {isConnected && userProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfileModal(true)}
              className="border-somnia-border hover:bg-somnia-hover text-foreground hover:text-primary flex items-center space-x-2"
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={userProfile.avatar} alt={userProfile.displayName} />
                <AvatarFallback className="bg-somnia-hover text-xs">
                  {userProfile.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline">{userProfile.displayName}</span>
            </Button>
          )}
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs md:text-sm px-2 md:px-4"
            data-create-token
          >
            <span className="hidden sm:inline">./new_token</span>
            <span className="sm:hidden">+</span>
          </Button>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-somnia-border bg-somnia-bg/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
                <Input
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  className="pl-10 bg-somnia-card border-somnia-border focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </form>
              
              {/* Mobile Search Suggestions */}
              {showSuggestions && filteredTokens.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-somnia-card border border-somnia-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.address}
                      onClick={() => {
                        handleSelectToken(token);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-somnia-hover transition-colors flex items-center space-x-3 border-b border-somnia-border/50 last:border-b-0"
                    >
                      <img
                        src={token.logo || token.imageUri || token.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${token.address}`}
                        alt={token.name}
                        className="w-5 h-5 rounded border border-somnia-border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${token.address}`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {token.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${token.symbol} • {token.somiRaised} SOMI
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Mobile Navigation */}
            <nav className="flex flex-col space-y-2">
              <Button 
                asChild 
                variant="ghost" 
                className="justify-start text-muted-foreground hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link to="/board">./board</Link>
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-muted-foreground hover:text-primary"
                onClick={() => {
                  setShowCreateModal(true);
                  setMobileMenuOpen(false);
                }}
              >
                ./create
              </Button>
              <Button 
                asChild 
                variant="ghost" 
                className="justify-start text-muted-foreground hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link to="/somnex">./somnex</Link>
              </Button>
              <Button 
                asChild 
                variant="ghost" 
                className="justify-start text-muted-foreground hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link to="/portfolio">./portfolio</Link>
              </Button>
              
              {/* Mobile Profile Button */}
              {isConnected && userProfile && (
                <Button
                  variant="outline"
                  className="justify-start border-somnia-border hover:bg-somnia-hover text-foreground hover:text-primary"
                  onClick={() => {
                    setShowProfileModal(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Avatar className="w-4 h-4 mr-2">
                    <AvatarImage src={userProfile.avatar} alt={userProfile.displayName} />
                    <AvatarFallback className="bg-somnia-hover text-xs">
                      {userProfile.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  ./profile
                </Button>
              )}
            </nav>
          </div>
        </div>
      )}
      
      <CreateTokenModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  );
};

export default Header;