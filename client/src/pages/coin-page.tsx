
import { useParams } from "wouter";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Clock, Tag } from "lucide-react";
import { TokenMetadata } from "@/components/token-metadata";

export default function CoinPage() {
  const { address } = useParams<{ address: string }>();

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1">
        {address ? (
          <div className="p-8">
            <TokenMetadata address={address} />

            {/* Main content tabs */}
            <Tabs defaultValue="directors" className="mt-8">
              <TabsList>
                <TabsTrigger value="directors">Board of Directors</TabsTrigger>
                <TabsTrigger value="chat">Community Chat</TabsTrigger>
              </TabsList>

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
