import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { TokenMetadata } from "@/components/token-metadata";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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

function AdminDashboard() {
  const { user } = useAuth();

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
                <TableHead>Token Info</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Wallet Address</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets?.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell>
                    <TokenMetadata address={wallet.contractAddress} />
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
