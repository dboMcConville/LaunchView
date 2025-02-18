import { useAuth } from "@/hooks/use-auth";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { PlusCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { insertCoinSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [showNewCoin, setShowNewCoin] = useState(false);

  const { data: coins, isLoading } = useQuery({
    queryKey: ["/api/coins"],
  });

  const form = useForm({
    resolver: zodResolver(insertCoinSchema),
  });

  const createCoin = async (data: any) => {
    await apiRequest("POST", "/api/coins", data);
    setShowNewCoin(false);
  };

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.username}</h1>
            <p className="text-muted-foreground">
              Manage your memecoin projects with LaunchView
            </p>
          </div>
          <Button onClick={() => logoutMutation.mutate()} variant="outline">
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Coins</CardTitle>
            <Button onClick={() => setShowNewCoin(true)} size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Coin
            </Button>
          </CardHeader>
          <CardContent>
            {showNewCoin && (
              <form onSubmit={form.handleSubmit(createCoin)} className="mb-6 space-y-4">
                <div>
                  <Label htmlFor="name">Coin Name</Label>
                  <Input id="name" {...form.register("name")} />
                </div>
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input id="symbol" {...form.register("symbol")} />
                </div>
                <div>
                  <Label htmlFor="marketingWalletAddress">Marketing Wallet (Optional)</Label>
                  <Input 
                    id="marketingWalletAddress" 
                    {...form.register("marketingWalletAddress")} 
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowNewCoin(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {coins?.map((coin: any) => (
                  <Link key={coin.id} href={`/coins/${coin.id}`}>
                    <Card className="hover:bg-accent cursor-pointer transition-colors">
                      <CardContent className="p-4">
                        <h3 className="font-bold">{coin.name}</h3>
                        <p className="text-sm text-muted-foreground">{coin.symbol}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
