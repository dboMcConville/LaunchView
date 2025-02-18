import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Users, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function BoardMembers({ coin }: { coin: any }) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState("");
  const { toast } = useToast();

  const connectWallet = async () => {
    try {
      await apiRequest("POST", "/api/wallets", { wallet });
      setWallet("");
      toast({
        title: "Success",
        description: "Wallet connected successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Board Members
        </CardTitle>
        <CardDescription>
          Connect your wallets to verify board membership
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {user && (
            <div className="space-y-4 mb-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Connect wallet address"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                />
                <Button onClick={connectWallet} disabled={!wallet}>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>
              {user.connectedWallets && user.connectedWallets.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Your Connected Wallets</h4>
                  {user.connectedWallets.map((wallet: string) => (
                    <div
                      key={wallet}
                      className="p-2 bg-secondary/50 rounded text-sm break-all"
                    >
                      {wallet}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
