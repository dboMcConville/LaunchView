import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Wallet, ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CommunityWallet({ coin }: { coin: any }) {
  const { toast } = useToast();

  const { data: transactions } = useQuery({
    queryKey: [`/api/coins/${coin.id}/community-transactions`],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Community Wallet
        </CardTitle>
        <CardDescription>
          Track community contributions and spending
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Wallet Address</h3>
            <div className="p-4 bg-secondary/50 rounded-lg break-all">
              {coin.communityWalletAddress}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Community Budget</h3>
            <div className="p-4 bg-secondary/50 rounded-lg text-xl font-bold">
              {Number(coin.communityWalletBalance).toLocaleString()} SOL
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Recent Transactions</h3>
            <div className="space-y-2">
              {transactions?.map((tx: any) => (
                <div key={tx.id} className="p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {tx.transactionType === 'contribution' ? (
                        <ArrowDownRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">
                        {Number(tx.amount).toLocaleString()} SOL
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {tx.transactionType === 'contribution' ? 'From: ' : 'To: '}
                    {tx.transactionType === 'contribution' ? tx.senderAddress : tx.receiverAddress}
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
            onClick={() => window.open(`https://explorer.solana.com/address/${coin.communityWalletAddress}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Solana Explorer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
