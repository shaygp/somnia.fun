import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  txHash?: string;
  tokenInfo?: {
    name: string;
    symbol: string;
    amount?: string;
  };
  type: "buy" | "sell" | "create";
}

const SuccessModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  txHash, 
  tokenInfo, 
  type 
}: SuccessModalProps) => {
  console.log('SuccessModal render:', { isOpen, title, message, txHash });
  const getIconColor = () => {
    switch (type) {
      case "buy":
        return "text-green-500";
      case "sell":
        return "text-red-500";
      case "create":
        return "text-primary";
      default:
        return "text-primary";
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "buy":
        return "bg-green-500/20";
      case "sell":
        return "bg-red-500/20";
      case "create":
        return "bg-primary/20";
      default:
        return "bg-primary/20";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground flex items-center">
              <div className={`w-10 h-10 rounded-full ${getBackgroundColor()} flex items-center justify-center mr-3`}>
                <CheckCircle className={`w-6 h-6 ${getIconColor()}`} />
              </div>
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{message}</p>
            
            {tokenInfo && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Token:</span>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {tokenInfo.name} ({tokenInfo.symbol})
                  </Badge>
                </div>
                {tokenInfo.amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="text-sm font-medium">{tokenInfo.amount}</span>
                  </div>
                )}
              </div>
            )}
            
            {txHash && (
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Transaction Hash:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 px-2 text-primary hover:text-primary/80"
                  >
                    <a
                      href={`https://shannon-explorer.somnia.network/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="text-xs">View</span>
                    </a>
                  </Button>
                </div>
                <p className="text-xs font-mono text-muted-foreground break-all bg-background/50 p-2 rounded">
                  {txHash}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Close
            </Button>
            {txHash && (
              <Button
                variant="outline"
                asChild
                className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <a
                  href={`https://shannon-explorer.somnia.network/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View on Explorer</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessModal;