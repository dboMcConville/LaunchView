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
      await apiRequest("POST", "/api/coins/add", { address: data.contractAddress });

      toast({
        title: "Success",
        description: "Coin has been added to LaunchView",
      });
      navigate(`/coins/${data.contractAddress}`);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const launchNewCoin = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/coins", data);
      const coin = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/coins"] });
      toast({
        title: "Success",
        description: "Your coin has been created successfully. A marketing wallet has been automatically generated.",
      });
      navigate(`/coins/${coin.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
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
                <TabsTrigger value="add">Add Existing Coin</TabsTrigger>
                <TabsTrigger value="launch">Launch New Coin</TabsTrigger>
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