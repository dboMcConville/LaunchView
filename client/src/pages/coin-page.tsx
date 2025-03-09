import { useAuth } from "@/hooks/use-auth";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { MarketingWallet } from "@/components/marketing-wallet";
import { BoardMembers } from "@/components/board-members";
import { VotingSection } from "@/components/voting-section";
import { CommentsSection } from "@/components/comments-section";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";

export default function CoinPage() {
  const { address } = useParams();
  const { user } = useAuth();

  const { data: coin, isLoading, error } = useQuery({
    queryKey: [`/api/coins/address/${address}`],
    retry: 1, // Only retry once to avoid unnecessary requests
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Coin not found</h1>
            <p className="text-muted-foreground">
              The coin with address {address} could not be found. This could mean:
            </p>
            <ul className="mt-4 text-left list-disc pl-6">
              <li>The contract address is incorrect</li>
              <li>The coin hasn't been added to LaunchView yet</li>
              <li>There was an error loading the coin data</li>
            </ul>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{coin.name}</h1>
          <p className="text-muted-foreground">{coin.symbol}</p>
          <div className="mt-2 text-sm text-muted-foreground break-all">
            Contract Address: {coin.marketingWalletAddress}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <MarketingWallet coin={coin} />
          <BoardMembers coin={coin} />
        </div>

        <div className="mt-8">
          <VotingSection coinId={coin.id} />
        </div>

        <div className="mt-8">
          <CommentsSection coinId={coin.id} />
        </div>
      </main>
    </div>
  );
}