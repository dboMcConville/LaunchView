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

export default function CreatePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertCoinSchema),
  });

  // If user is not an admin, redirect to home
  if (!user?.isAdmin) {
    navigate("/");
    return null;
  }

  const createCoin = async (data: any) => {
    try {
      await apiRequest("POST", "/api/coins/add", data);
      // Invalidate the coins query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/coins"] });
      toast({
        title: "Success",
        description: "Your coin has been created successfully. A community wallet has been automatically generated. Check the console for wallet details.",
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
              Fill in the basic information about your coin. A community wallet will be automatically created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(createCoin)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="contractAddress">Contract Address</Label>
                <Input id="contractAddress" {...form.register("contractAddress")} />
                {form.formState.errors.contractAddress && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.contractAddress.message?.toString()}
                  </p>
                )}
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