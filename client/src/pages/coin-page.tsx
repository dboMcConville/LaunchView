
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, BarChart2 } from "lucide-react";

export default function CoinPage() {
  const { address } = useParams();
  const { data: coin } = useQuery([`/api/coins/${address}`]);

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{coin?.name || 'Loading...'}</h1>
          <p className="text-muted-foreground">{coin?.symbol || ''}</p>
        </div>

        {/* KPIs in a compact top bar */}
        <div className="flex gap-6 mb-8 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Market Cap:</span>
            <span className="text-sm">$1.2M</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Holders:</span>
            <span className="text-sm">1,234</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">24h Volume:</span>
            <span className="text-sm">$567K</span>
          </div>
        </div>

        {/* Main content tabs */}
        <Tabs defaultValue="directors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="directors">Board of Directors</TabsTrigger>
            <TabsTrigger value="chat">Community Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="directors">
            <Card>
              <CardHeader>
                <CardTitle>Board of Directors</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add Board of Directors content here */}
                <p>Board members and voting information will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Community Chat</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add Community Chat content here */}
                <p>Community discussion and updates will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
