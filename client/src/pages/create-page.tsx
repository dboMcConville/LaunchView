import { useAuth } from "@/hooks/use-auth";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCoinSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CreatePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertCoinSchema),
  });

  const createCoin = async (data: any) => {
    try {
      await apiRequest("POST", "/api/coins", data);
      toast({
        title: "Success",
        description: "Your coin has been created successfully",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Coin</h1>
          <p className="text-muted-foreground">
            Launch your memecoin project on LaunchView
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Coin Details</CardTitle>
            <CardDescription>
              Fill in the basic information about your coin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(createCoin)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Coin Name</Label>
                <Input id="name" {...form.register("name")} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input id="symbol" {...form.register("symbol")} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="marketingWalletAddress">Marketing Wallet (Optional)</Label>
                <Input 
                  id="marketingWalletAddress" 
                  {...form.register("marketingWalletAddress")} 
                />
                <p className="text-sm text-muted-foreground">
                  This wallet will be used for managing marketing funds
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Coin</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
