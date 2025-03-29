
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

export default function LaunchPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const addForm = useForm({
    defaultValues: {
      contractAddress: "",
    },
  });

  const launchForm = useForm({
    resolver: zodResolver(insertCoinSchema),
  });

  const addExistingCoin = async (data: { contractAddress: string }) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/coins/add", { address: data.contractAddress });
      const coin = await res.json();

      toast({
        title: "Coin Added",
        description: `${coin.name} has been successfully added!`,
      });
      queryClient.invalidateQueries(["/api/coins"]);
    } catch (error) {
      toast({
        title: "Error Adding Coin",
        description: "There was an error adding the coin. Please try again.",
        status: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const launchNewCoin = async (data: { name: string; symbol: string }) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/coins/launch", data);
      const coin = await res.json();

      toast({
        title: "Coin Launched",
        description: `${coin.name} has been successfully launched!`,
      });
      queryClient.invalidateQueries(["/api/coins"]);
    } catch (error) {
      toast({
        title: "Error Launching Coin",
        description: "There was an error launching the coin. Please try again.",
        status: "error",
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

        {/* KPIs Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Market Cap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">$1,234,567</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" /> Holders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">1,234</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart2 className="h-4 w-4" /> 24hr Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">$567,890</div>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Coin Details</CardTitle>
            <CardDescription>
              Choose whether to add an existing coin or launch a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="add">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="add">Board of Directors</TabsTrigger>
                <TabsTrigger value="launch">Community Chat</TabsTrigger>
              </TabsList>

              <TabsContent value="add">
                <form onSubmit={addForm.handleSubmit(addExistingCoin)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="ca">Contract Address</Label>
                    <Input 
                      id="ca" 
                      {...addForm.register("contractAddress")} 
                      placeholder="Enter the contract address of your coin"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      Add to LaunchView
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate("/")}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="launch">
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

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      Launch Coin
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate("/")}
                    >
                      Cancel
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
