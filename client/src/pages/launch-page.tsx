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
      queryClient.invalidateQueries(["/api/coins"]);
      toast({
        title: "Success",
        description: "Coin has been added to LaunchView",
      });
      navigate(`/coins/${coin.contractAddress}`);
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
      queryClient.invalidateQueries(["/api/coins"]);
      toast({
        title: "Success",
        description: "Your coin has been created successfully",
      });
      navigate(`/coins/${coin.contractAddress}`);
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
          <h1 className="text-3xl font-bold">Launch Your Token</h1>
          <p className="text-muted-foreground">
            Create or add your token to LaunchView
          </p>
        </div>

        {/* KPI Stats Bar */}
        <div className="flex gap-4 mb-8">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Market Cap:</span>
            <span>$1.2M</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            <span className="font-medium">Holders:</span>
            <span>1,234</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BarChart2 className="h-4 w-4" />
            <span className="font-medium">24h Volume:</span>
            <span>$567K</span>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Coin Details</CardTitle>
            <CardDescription>
              View information about the coin's team and community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="directors">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="directors">Board of Directors</TabsTrigger>
                <TabsTrigger value="chat">Community Chat</TabsTrigger>
              </TabsList>

              <TabsContent value="directors">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Board Members</h3>
                  <p className="text-sm text-muted-foreground">
                    Information about the team will be displayed here
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="chat">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Community Discussion</h3>
                  <p className="text-sm text-muted-foreground">
                    Chat interface will be implemented here
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}