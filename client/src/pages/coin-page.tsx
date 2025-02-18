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
  const { id } = useParams();
  const { user } = useAuth();

  const { data: coin, isLoading } = useQuery({
    queryKey: [`/api/coins/${id}`],
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

  if (!coin) {
    return (
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold">Coin not found</h1>
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
