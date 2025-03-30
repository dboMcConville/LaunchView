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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { TrendingUp, Users, BarChart2 } from "lucide-react";

interface AddCoinFormData {
  contractAddress: string;
}

interface LaunchCoinFormData {
  name: string;
  symbol: string;
}

export default function LaunchPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const addForm = useForm<AddCoinFormData>({
    defaultValues: {
      contractAddress: "",
    },
  });

  const launchForm = useForm<LaunchCoinFormData>({
    resolver: zodResolver(insertCoinSchema),
  });

  const addExistingCoin = async (data: AddCoinFormData) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/coins/add", { address: data.contractAddress });
      const coin = await res.json();

      toast({
        title: "Coin Added",
        description: `${coin.name} has been successfully added!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coins"] });
    } catch (error) {
      toast({
        title: "Error Adding Coin",
        description: "There was an error adding the coin. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const launchNewCoin = async (data: LaunchCoinFormData) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/coins/launch", data);
      const coin = await res.json();

      toast({
        title: "Coin Launched",
        description: `${coin.name} has been successfully launched!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coins"] });
    } catch (error) {
      toast({
        title: "Error Launching Coin",
        description: "There was an error launching the coin. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Launch</h1>
          <p className="text-muted-foreground">
            Add or launch your memecoin project on LaunchView
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="existing" className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Existing Coin</TabsTrigger>
                <TabsTrigger value="new">New Coin</TabsTrigger>
              </TabsList>

              <TabsContent value="existing">
                <form onSubmit={addForm.handleSubmit(addExistingCoin)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="ca">Contract Address</Label>
                    <Input 
                      id="ca" 
                      {...addForm.register("contractAddress")} 
                      placeholder="Enter the contract address of your coin"
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Adding..." : "Add Coin"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="new">
                <form onSubmit={launchForm.handleSubmit(launchNewCoin)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Coin Name</Label>
                    <Input id="name" {...launchForm.register("name")} />
                    {launchForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {String(launchForm.formState.errors.name.message)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input id="symbol" {...launchForm.register("symbol")} />
                    {launchForm.formState.errors.symbol && (
                      <p className="text-sm text-destructive">
                        {String(launchForm.formState.errors.symbol.message)}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Launching..." : "Launch Coin"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
