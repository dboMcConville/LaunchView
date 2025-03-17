import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const LAMPORTS_PER_SOL = 1e9; // 1 SOL = 1,000,000,000 lamports

interface CommunityWalletWithCoin {
  id: number;
  coinId: number;
  walletAddress: string;
  balance: string;
  lastUpdated: string;
  coinName: string;
  coinSymbol: string;
  contractAddress: string;
}

interface TransferDialogProps {
  wallet: CommunityWalletWithCoin;
  onClose: () => void;
}

function TransferDialog({ wallet, onClose }: TransferDialogProps) {
  const [amount, setAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const { toast } = useToast();

  const handleTransfer = async () => {
    try {
      setIsTransferring(true);
      const response = await apiRequest("POST", `/api/admin/community-wallets/${wallet.id}/transfer`, {
        amount,
        destinationAddress,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();

      toast({
        title: "Transfer successful",
        description: `Successfully transferred ${amount} SOL. New balance: ${
          parseFloat(result.newBalance) / LAMPORTS_PER_SOL
        } SOL`,
      });

      // Invalidate the community wallets query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community-wallets"] });
      onClose();
    } catch (error) {
      toast({
        title: "Transfer failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Transfer Funds - {wallet.coinName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>From Wallet</Label>
          <Input disabled value={wallet.walletAddress} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (SOL)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount in SOL"
            step="0.000000001"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="destination">Destination Address</Label>
          <Input
            id="destination"
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
            placeholder="Enter destination wallet address"
          />
        </div>
        <Button
          onClick={handleTransfer}
          className="w-full"
          disabled={isTransferring}
        >
          {isTransferring ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Transferring...
            </>
          ) : (
            "Transfer"
          )}
        </Button>
      </div>
    </DialogContent>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const [selectedWallet, setSelectedWallet] = useState<CommunityWalletWithCoin | null>(null);

  // Fetch community wallets with coin information
  const { data: wallets, isLoading, error } = useQuery<CommunityWalletWithCoin[]>({
    queryKey: ["/api/admin/community-wallets"],
    enabled: !!user?.isAdmin,
  });

  if (!user?.isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            You do not have permission to view this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-destructive">
            Error loading community wallets: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Community Wallets Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Wallet Address</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets?.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell>
                    {/* Simple token logo display */}
                    {wallet.contractAddress && (
                      <img
                        src={`https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${wallet.contractAddress}/logo.png`}
                        alt={wallet.coinName}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/32x32";
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{wallet.coinName}</TableCell>
                  <TableCell>{wallet.coinSymbol}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {wallet.walletAddress}
                  </TableCell>
                  <TableCell>{wallet.balance}</TableCell>
                  <TableCell>
                    {new Date(wallet.lastUpdated).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Dialog open={selectedWallet?.id === wallet.id} onOpenChange={(open) => {
                      if (!open) setSelectedWallet(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWallet(wallet)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Transfer
                        </Button>
                      </DialogTrigger>
                      {selectedWallet && (
                        <TransferDialog
                          wallet={selectedWallet}
                          onClose={() => setSelectedWallet(null)}
                        />
                      )}
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap the component with ProtectedRoute
export function AdminPage() {
  return (
    <ProtectedRoute
      path="/admin"
      component={AdminDashboard}
    />
  );
}