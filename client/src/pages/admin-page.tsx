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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

import { useEffect } from "react";

const LAMPORTS_PER_SOL = 1e9; // 1 SOL = 1,000,000,000 lamports

interface TokenInfo {
  symbol: string;
  name: string;
  mint: string;
  balance: number;
  decimals: number;
}

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

const TransferDialog = ({ wallet, onClose }) => {
  const [availableTokens, setAvailableTokens] = useState([]);
  const [selectedTokenMint, setSelectedTokenMint] = useState("sol");
  const [amount, setAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTokens() {
      try {
        const res = await fetch(`/api/wallet/${wallet.walletAddress}/tokens`);
        const tokens = await res.json();
        setAvailableTokens(tokens);
      } catch (err) {
        toast({
          title: "Failed to load tokens",
          description: err.message,
          variant: "destructive",
        });
      }
  };

  fetchAvailableTokens();
}, [wallet.walletAddress]);

// Handle transfer logic
const handleTransfer = async () => {
  setIsTransferring(true);
  const isSol = selectedTokenMint === 'sol';

  const response = await fetch('/api/transfer', {
    method: "POST",
    body: JSON.stringify({
      amount,
      tokenMint: isSol ? null : selectedTokenMint,
      destinationAddress,
      walletAddress: wallet.walletAddress
    }),
  });

  // existing response/error handling logic
};

// JSX:
return (
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Transfer Tokens</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>From Wallet</Label>
        <Input disabled value={wallet.walletAddress} />
      </div>

      <div className="space-y-2">
        <Label>Token Type</Label>
        <Select value={selectedTokenMint} onValueChange={setSelectedTokenMint}>
          <SelectTrigger>
            <SelectValue placeholder="Select token type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sol">SOL (Native)</SelectItem>
            {availableTokens.map(token => (
              <SelectItem key={token.mint} value={token.mint}>
                {token.mint.slice(0,4)}...{token.mint.slice(-4)} ({token.tokenAmount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          type="number"
          min={0}
        />
      </div>

      <div className="space-y-2">
        <Label>Destination Wallet</Label>
        <Input
          value={destinationAddress}
          onChange={(e) => setDestinationAddress(e.target.value)}
          placeholder="Enter wallet address"
        />
      </div>

      <Button onClick={handleTransfer} disabled={isTransferring}>
        {isTransferring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Transfer
      </Button>
    </div>
  </DialogContent>
);

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