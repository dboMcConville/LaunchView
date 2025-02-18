import { useAuth } from "@/hooks/use-auth";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Wallet, Users } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  const { data: coins, isLoading } = useQuery({
    queryKey: ["/api/coins"],
  });

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Discover Memecoins</h1>
            <p className="text-muted-foreground">
              Find promising projects with active communities
            </p>
          </div>
          <Button onClick={() => logoutMutation.mutate()} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coins?.map((coin: any) => (
            <Link key={coin.id} href={`/coins/${coin.id}`}>
              <Card className="hover:bg-accent cursor-pointer transition-colors h-full">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{coin.name}</h3>
                      <p className="text-sm text-muted-foreground">{coin.symbol}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex items-center gap-1">
                        Marketing Budget: {Number(coin.marketingWalletBalance).toLocaleString()} 
                        <img 
                          src="/node_modules/cryptocurrency-icons/svg/color/usdc.svg" 
                          alt="USDC"
                          className="h-4 w-4"
                        />
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Board Members: TBD
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}