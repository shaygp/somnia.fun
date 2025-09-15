import { useEffect, useState } from "react";
import { useReadContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { usePumpFun } from "@/hooks/usePumpFun";
import { useToast } from "@/hooks/use-toast";
import { CONTRACT_ADDRESSES, BONDING_CURVE_ABI } from "@/config/contracts";
import { Button } from "@/components/ui/button";
import { Loader2, Rocket } from "lucide-react";

interface CurveInitializerProps {
  tokenAddress: string;
  onInitialized?: () => void;
}

const CurveInitializer = ({ tokenAddress, onInitialized }: CurveInitializerProps) => {
  const { toast } = useToast();
  const { address } = useAccount();
  const { initializeCurve } = usePumpFun();
  const [isInitializing, setIsInitializing] = useState(false);
  const [txHash, setTxHash] = useState("");

  // Check if curve is already initialized
  const { data: curveInfo, isLoading: curveLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
    abi: BONDING_CURVE_ABI,
    functionName: 'getCurveInfo',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESSES.BONDING_CURVE && !!tokenAddress,
    },
  });

  const { isSuccess, isError } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
    query: {
      enabled: !!txHash,
    },
  });

  useEffect(() => {
    if (isSuccess && txHash) {
      console.log('Curve initialization confirmed:', txHash);
      setIsInitializing(false);
      setTxHash("");
      toast({
        title: "Curve Initialized!",
        description: "Token is now ready for trading",
      });
      refetch();
      onInitialized?.();
    }
  }, [isSuccess, txHash, toast, refetch, onInitialized]);

  useEffect(() => {
    if (isError && txHash) {
      console.error('Curve initialization failed');
      setIsInitializing(false);
      setTxHash("");
      toast({
        title: "Initialization Failed",
        description: "Failed to initialize curve. Please try again.",
        variant: "destructive"
      });
    }
  }, [isError, txHash, toast]);

  const handleInitialize = async () => {
    if (!address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to initialize curve",
        variant: "destructive"
      });
      return;
    }

    setIsInitializing(true);

    try {
      const hash = await initializeCurve(tokenAddress);
      console.log('Curve initialization hash:', hash);
      
      if (hash) {
        setTxHash(String(hash));
        toast({
          title: "Initializing Curve",
          description: "Transaction submitted. Please wait for confirmation...",
        });
      } else {
        throw new Error("No transaction hash received");
      }
    } catch (error: any) {
      console.error("Curve initialization error:", error);
      toast({
        title: "Initialization Failed",
        description: error?.message || "Failed to initialize curve",
        variant: "destructive"
      });
      setIsInitializing(false);
    }
  };

  if (curveLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Checking curve status...</span>
      </div>
    );
  }

  // If curve is already initialized and active, don't show anything
  if (curveInfo && (curveInfo as any).active) {
    return null;
  }

  // Show initialize button if curve is not initialized
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center space-x-2">
          <Rocket className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-yellow-800">Trading Not Available</h3>
        </div>
        <p className="text-sm text-yellow-700">
          This token needs its bonding curve initialized before trading can begin. 
          This is a one-time setup that enables price discovery and trading.
        </p>
        <Button
          onClick={handleInitialize}
          disabled={isInitializing}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {isInitializing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Initializing...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4 mr-2" />
              Initialize Trading
            </>
          )}
        </Button>
        <p className="text-xs text-yellow-600">
          Anyone can initialize a curve. This transaction is free except for gas fees.
        </p>
      </div>
    </div>
  );
};

export default CurveInitializer;