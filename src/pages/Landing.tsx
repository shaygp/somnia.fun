import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowRight, Terminal, Plus } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { usePumpFun } from "@/hooks/usePumpFun";
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useToast } from "@/hooks/use-toast";
import WalletConnection from "@/components/WalletConnection";

const Landing = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { createToken } = usePumpFun();
  const { toast } = useToast();
  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    description: "",
    imageUri: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const [txHash, setTxHash] = useState("");

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  const handleCreate = async () => {
    if (!tokenData.name || !tokenData.symbol) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to create tokens",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const hash = await createToken(
        tokenData.name,
        tokenData.symbol,
        tokenData.imageUri || "https://via.placeholder.com/256",
        tokenData.description
      );
      
      setTxHash(hash);
      
      toast({
        title: "Token Creation Initiated",
        description: "Waiting for transaction confirmation...",
      });
    } catch (error: any) {
      console.error("Token creation error:", error);
      toast({
        title: "Creation Failed",
        description: error?.message || "Failed to create token",
        variant: "destructive"
      });
      setIsCreating(false);
    }
  };

  React.useEffect(() => {
    if (isSuccess) {
      setIsCreating(false);
      toast({
        title: "Token Created Successfully!",
        description: "Your token has been deployed on Somnia",
      });
      
      setTimeout(() => {
        navigate('/board');
      }, 2000);
    }
  }, [isSuccess, navigate, toast]);

  const handleEnterBoard = () => {
    navigate('/board');
  };

  return (
    <div className="min-h-screen bg-somnia-bg text-foreground relative scan-lines">
      <AnimatedBackground />
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Terminal Header */}
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-3">
            <Terminal className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-medium text-primary terminal-cursor">SOMNIA.FUN</h1>
              <p className="text-sm text-muted-foreground">token_launchpad.exe</p>
            </div>
          </div>
          <WalletConnection />
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Welcome Message */}
          <Card className="bg-somnia-card border-somnia-border p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-primary">$</span>
                <span className="text-muted-foreground">welcome to Somnia.fun token launchpad</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary">$</span>
                <span className="text-muted-foreground">enter token details below to mint on Somnia blockchain</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary">$</span>
                <span className="text-muted-foreground">or type './board' to explore existing tokens</span>
              </div>
            </div>
          </Card>

          {/* Create Token Form */}
          <Card className="bg-somnia-card border-somnia-border p-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-primary">$</span>
                <span className="text-foreground font-medium">./create_token --interactive</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">
                    token_name:
                  </label>
                  <Input
                    placeholder="My Awesome Token"
                    value={tokenData.name}
                    onChange={(e) => setTokenData({...tokenData, name: e.target.value})}
                    className="bg-somnia-hover border-somnia-border focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">
                    symbol:
                  </label>
                  <Input
                    placeholder="MAT"
                    value={tokenData.symbol}
                    onChange={(e) => setTokenData({...tokenData, symbol: e.target.value.toUpperCase()})}
                    className="bg-somnia-hover border-somnia-border focus:border-primary focus:ring-1 focus:ring-primary"
                    maxLength={6}
                  />
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">
                    image_uri (optional):
                  </label>
                  <Input
                    placeholder="https://example.com/image.png"
                    value={tokenData.imageUri}
                    onChange={(e) => setTokenData({...tokenData, imageUri: e.target.value})}
                    className="bg-somnia-hover border-somnia-border focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-2">
                    description:
                  </label>
                  <Textarea
                    placeholder="A revolutionary token that will change everything..."
                    value={tokenData.description}
                    onChange={(e) => setTokenData({...tokenData, description: e.target.value})}
                    className="bg-somnia-hover border-somnia-border focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px]"
                    maxLength={200}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {tokenData.description.length}/200 characters
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <Button
                  onClick={handleCreate}
                  disabled={!tokenData.name || !tokenData.symbol || isCreating || isConfirming || !isConnected}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center space-x-2"
                >
                  {isCreating || isConfirming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      <span>{isConfirming ? "confirming..." : "deploying..."}</span>
                    </>
                  ) : !isConnected ? (
                    <>
                      <span>connect wallet first</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>./deploy --now</span>
                    </>
                  )}
                </Button>
                
                <span className="text-muted-foreground text-sm">or</span>
                
                <Button
                  variant="outline"
                  onClick={handleEnterBoard}
                  className="border-somnia-border hover:bg-somnia-hover flex items-center space-x-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>./board</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Terminal Footer */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground text-sm">
              <span>$</span>
              <span>powered by Somnia blockchain • minimal fees • instant liquidity</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;