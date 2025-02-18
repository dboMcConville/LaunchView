import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Wallet, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function MarketingWallet({ coin }: { coin: any }) {
  const [address, setAddress] = useState("");
  const { toast } = useToast();

  const setMarketingWallet = async () => {
    try {
      await apiRequest("POST", `/api/coins/${coin.id}/marketing-wallet`, {
        address,
      });
      toast({
        title: "Success",
        description: "Marketing wallet has been set",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Marketing Wallet
        </CardTitle>
        <CardDescription>
          Manage your coin's marketing funds securely
        </CardDescription>
      </CardHeader>
      <CardContent>
        {coin.marketingWalletAddress ? (
          <div className="space-y-4">
            <div className="p-4 bg-secondary/50 rounded-lg break-all">
              {coin.marketingWalletAddress}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(`https://etherscan.io/address/${coin.marketingWalletAddress}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Etherscan
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              placeholder="Enter wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={setMarketingWallet}
              disabled={!address}
            >
              Set Marketing Wallet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
