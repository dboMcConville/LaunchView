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
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Wallet, ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function MarketingWallet({ coin }: { coin: any }) {
  const [address, setAddress] = useState("");
  const { toast } = useToast();

  const { data: transactions } = useQuery({
    queryKey: [`/api/coins/${coin.id}/transactions`],
  });

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
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Wallet Address</h3>
              <div className="p-4 bg-secondary/50 rounded-lg break-all">
                {coin.marketingWalletAddress}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Total Balance</h3>
              <div className="p-4 bg-secondary/50 rounded-lg text-xl font-bold">
                {Number(coin.marketingWalletBalance).toLocaleString()} USDC
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Recent Transactions</h3>
              <div className="space-y-2">
                {transactions?.map((tx: any) => (
                  <div key={tx.id} className="p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {Number(tx.amount) >= 0 ? (
                          <ArrowDownRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">
                          {Number(tx.amount).toLocaleString()} USDC
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      From: {tx.senderAddress}
                    </div>
                    {tx.description && (
                      <div className="text-sm mt-1">{tx.description}</div>
                    )}
                  </div>
                ))}
              </div>
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